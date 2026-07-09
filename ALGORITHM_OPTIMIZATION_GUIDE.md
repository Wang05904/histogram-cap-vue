# 直方图算法优化说明

## 模块职责

本项目的直方图计算逻辑集中在 `src/utils` 和 `src/workers` 中，页面只负责上传图片、调用接口和展示结果。算法输出保持固定格式：

- `bins`：256 个灰度原始计数。
- `normalizedBins`：256 个 `0..100` 高度值，用于绘制 `256 x 100` 黑白直方图。
- `histogramImageData`：页面渲染阶段可选生成，不参与自动最快 benchmark 维度。
- `timing`：计算、归一化、数据生成和总耗时。

## 灰度公式

所有算法都固定使用题目要求的标准公式：

```js
gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
```

## 核心接口

- `src/utils/histogramBase.js`：准确基准算法，用于正确性校验。
- `src/utils/histogramOpt.js`：统一优化接口，导出 `runBaseHistogram`、`runOptimizedHistogram`、`runFastestHistogram`。
- `src/utils/histogramBenchmark.js`：批量 benchmark，记录耗时和准确性。
- `src/workers/pixelCalc.worker.js`：Worker 内部计算逻辑。

## 当前保留的优化维度

### 1. 灰度计算策略

- `directGray`：逐像素直接执行标准公式。
- `lookupGray`：预先建立 R/G/B 三张 `Float64Array` 查表，再执行 `Math.round(rTable[r] + gTable[g] + bTable[b])`。

查表方式保持与标准公式完全一致。在测试图片中，小图和中图常由 `lookupGray` 胜出，因此保留为自动候选。

### 2. 遍历与循环展开

- `normalLoop`：普通 RGBA 步长循环。
- `unroll4`：每轮处理 4 个像素，减少循环控制成本。

`unroll2` 和 `unroll8` 已测试，但平均收益不如 `unroll4` 或波动更大，因此只作为 benchmark 对照，不参与自动最快选择。

### 3. 线程策略

- `mainThread`：主线程直接计算，小图和中图没有 Worker 通信成本。
- `singleWorker`：单个 Worker 计算，验证线程迁移是否能减少主线程压力。
- `chunkWorker`：单 Worker 内部分块处理，当前测试 32KB 和 256KB 两种分块。
- `fixed2Worker`：固定 2 个 Worker 并行计算，通信成本较低。
- `fixed4Worker`：固定 4 个 Worker 分片计算并合并 256 个 bin，大图上收益明显。

以上 Worker 方案现在都参与自动候选。Worker 不一定更快，原因是启动、数据复制、线程通信和合并结果都有额外成本；自动最快会用当前图片的实测平均耗时决定是否选择它们。

## 数据结构维度结论

`histArray` 与 `histTypedArray` 在测试中没有稳定单边优势：部分图片 `histArray` 略快，部分图片 `histTypedArray` 略快。为了让页面展示和自动选择更完整，当前版本把数据结构也纳入自动最快候选。

- `histArray`：普通 `Array(256)`，实现直观，部分主线程组合可能有较低开销。
- `histTypedArray`：`Uint32Array(256)`，内存结构固定，与 Worker 输出和合并更清晰。

自动最快会同时比较这两类数据结构，但仍然要求结果与基准算法完全一致。

## 自动候选维度选择

页面已删除“默认精确”固定选项，避免用户误以为某个固定组合在所有图片上都最优。当前推荐入口是“自动最快（精确）”，它会根据当前图片的 benchmark 结果选择最快正确组合。

自动最快只在以下维度中选择：

| 维度 | 自动候选 | 说明 |
|---|---|---|
| 灰度公式 | 固定标准公式 | 必须使用 `Math.round(red * 0.299 + green * 0.587 + blue * 0.114)` |
| 灰度计算策略 | `directGray` / `lookupGray` | 直接公式与精确查表，二者都必须与基准完全一致 |
| 遍历策略 | `normalLoop` / `unroll4` | 普通循环与展开 4 像素 |
| 数据结构 | `histArray` / `histTypedArray` | 普通数组与 TypedArray 都参与自动选择 |
| 线程策略 | `mainThread` / `singleWorker` / `chunkWorker` / `fixed2Worker` / `fixed4Worker` | 让单线程、分块和多 Worker 都参与自动比较 |
| 渲染数据 | 不作为 benchmark 维度 | 自动选择阶段不再测试 `includeImageData`，避免渲染数据生成干扰算法选择 |

因此自动最快不是从所有展示行中选择，而是从“正确且有实际价值”的候选子集里选择。当前性能对比表会展示更多数据结构组合，例如 `directGray + normalLoop + histArray`、`lookupGray + unroll4 + histArray` 和 `singleWorker + histArray`，便于答辩时解释数据结构维度的影响。

## 自动最快选择逻辑

页面的“自动最快（精确）”流程：

1. 对当前图片运行 `benchmarkHistogramAlgorithms()`。
2. 丢弃第一次冷启动结果，每个组合统计 5 次平均耗时。
3. 对每个组合记录计算耗时、归一化耗时、数据生成耗时、平均耗时、最小耗时、最大耗时和正确性。
4. 过滤掉 `benchmarkOnly` 对照组合，例如 `unroll2`、`unroll8`。
5. 只保留与基准算法 256 个 bin 完全一致的组合，即 `sameAsBaseline === true`。
6. 从剩余候选中选择平均耗时最短者。
7. 使用该组合重新生成当前图片的直方图，并把算法名称、耗时和正确性结果返回给页面展示。

`runFastestHistogram(imageData)` 也会按当前图片动态 benchmark 后选择最快精确组合。

## 已测试但未作为自动候选的方向

- `unroll2` / `unroll8`：没有稳定优于保留方案，保留为对照项。
- `includeImageData`：已从 benchmark 组合中删除。自动最快只比较直方图统计与归一化，页面需要绘制时再生成或使用 `normalizedBins`。

## 结果保存与异常提示

当前版本在页面层补充了结果保存和异常分类，不改变算法核心：

- 保存直方图：根据 `normalizedBins` 生成 256×100 黑白 PNG。
- 保存标记原图：在原图右上角标注 `<300ms`、是否与基准一致和算法名称。
- Web 端保存方式：触发浏览器下载 PNG。
- Android/Capacitor 端保存方式：使用 `@capacitor/filesystem` 写入应用本地文件目录。
- 注意：`@capacitor/camera` 的 `saveToGallery` 主要用于拍照/选图流程，不适合直接保存任意 canvas 生成图；如果必须写入系统相册，需要额外接入 Android MediaStore 或相册保存插件。

异常处理会区分文件类型不支持、图片解码失败、图片过大/OOM、Canvas 不可用、Worker 失败、保存失败和权限拒绝，并给出中文提示。

## 验证命令

```bash
npm run build
```

推荐用 `public/image` 中小图、中图、大图分别测试，观察耗时、是否低于 300ms、是否与基准一致。
