# 直方图性能报告

## 测试环境

- 项目：Vue 3 + Vite + Capacitor
- 运行方式：Vite 浏览器环境，`http://127.0.0.1:5173`
- Node：22.9.0
- 测试方式：每个组合运行 6 次，丢弃第 1 次冷启动结果，统计后 5 次平均值。

## 测试图片

使用 `public/image` 中 6 张图片，覆盖小图、中图、大图：

- `lena256.bmp`：256x256，65,536 像素
- `avion.bmp`：512x512，262,144 像素
- `fruit.bmp`：512x512，262,144 像素
- `Goldhill.bmp`：512x512，262,144 像素
- `boats.bmp`：1024x1024，1,048,576 像素
- `test1.jpg`：5464x8192，44,761,088 像素

## 算法组合说明

所有组合都固定使用：

```js
gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
```

已删除 `intGray`，原因是题目明确要求固定灰度公式，整数近似会引入统计差异。当前自动候选只包含与基准算法完全一致的组合。

## 数据结构维度结论

`histArray` 与 `histTypedArray` 对比结果如下：

| 图片 | histArray 平均耗时 | histTypedArray 平均耗时 | 更快项 |
|---|---:|---:|---|
| lena256.bmp | 1.20ms | 2.94ms | histArray |
| avion.bmp | 7.54ms | 4.98ms | histTypedArray |
| fruit.bmp | 4.52ms | 4.96ms | histArray |
| Goldhill.bmp | 2.96ms | 2.94ms | histTypedArray |
| boats.bmp | 18.84ms | 19.54ms | histArray |
| test1.jpg | 642.22ms | 680.22ms | histArray |

结论：差异不稳定，且收益不是主要瓶颈。自动最快候选固定使用 `histTypedArray`，因为它内存结构稳定，适合 Worker 结果合并；`histArray` 只保留为 benchmark 对照项。

## 性能对比表

| 算法组合 | 图片 | 尺寸 | 像素数 | 计算耗时 | 归一化耗时 | 数据生成耗时 | 总耗时 | 平均耗时 | 是否低于300ms | 是否与基准一致 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| mainThread-lookupGray-normalLoop-histTypedArray | lena256.bmp | 256x256 | 65,536 | 1.04ms | 0.00ms | 0.00ms | 1.04ms | 1.04ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | avion.bmp | 512x512 | 262,144 | 4.48ms | 0.02ms | 0.00ms | 4.50ms | 4.50ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | fruit.bmp | 512x512 | 262,144 | 4.34ms | 0.04ms | 0.00ms | 4.38ms | 4.38ms | 是 | 是 |
| mainThread-lookupGray-unroll4-histTypedArray | Goldhill.bmp | 512x512 | 262,144 | 2.68ms | 0.00ms | 0.00ms | 2.68ms | 2.68ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | boats.bmp | 1024x1024 | 1,048,576 | 17.68ms | 0.02ms | 0.00ms | 17.70ms | 17.70ms | 是 | 是 |
| fixed4Worker-directGray-unroll4-histTypedArray-workers4 | test1.jpg | 5464x8192 | 44,761,088 | 313.04ms | 0.00ms | 0.00ms | 313.04ms | 313.04ms | 否 | 是 |

> 注：完整 benchmark 结果在页面“性能对比”中可查看；报告表聚焦每张图片的最快正确组合。

## 组合平均结果

| 算法组合 | 平均耗时 | 最小耗时 | 最大耗时 | 自动候选 | 是否与基准一致 |
|---|---:|---:|---:|---|---|
| fixed4Worker-directGray-unroll4-histTypedArray-workers4 | 55.063ms | 2.100ms | 250.200ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | 109.740ms | 1.100ms | 641.500ms | 是 | 是 |
| mainThread-lookupGray-unroll4-histTypedArray | 115.943ms | 1.100ms | 731.400ms | 是 | 是 |
| mainThread-directGray-unroll4-histTypedArray | 117.617ms | 1.200ms | 703.500ms | 是 | 是 |
| mainThread-directGray-normalLoop-histTypedArray | 119.263ms | 1.200ms | 695.200ms | 是 | 是 |
| mainThread-directGray-normalLoop-histArray | 112.880ms | 1.000ms | 666.700ms | 否，对照项 | 是 |
| mainThread-directGray-unroll2-histTypedArray | 122.000ms | 1.200ms | 705.000ms | 否，对照项 | 是 |
| mainThread-directGray-unroll8-histTypedArray | 119.337ms | 1.200ms | 707.200ms | 否，对照项 | 是 |
| singleWorker-directGray-unroll4-histTypedArray | 145.210ms | 2.100ms | 834.900ms | 否，对照项 | 是 |
| chunkWorker-directGray-unroll4-histTypedArray-chunk32768 | 127.163ms | 2.300ms | 750.600ms | 否，对照项 | 是 |
| chunkWorker-directGray-unroll4-histTypedArray-chunk262144 | 129.127ms | 2.100ms | 799.400ms | 否，对照项 | 是 |
| fixed2Worker-directGray-unroll4-histTypedArray-workers2 | 89.237ms | 2.100ms | 472.500ms | 否，对照项 | 是 |

## 当前最快正确组合

综合 6 张测试图片，最快自动候选为：

```js
{
  grayStrategy: 'directGray',
  loopMode: 'unroll4',
  dataMode: 'histTypedArray',
  threadMode: 'fixed4Worker',
  workerCount: 4
}
```

在包含 `test1.jpg` 的大图测试中，该组合是大图最快正确方案之一。所有测试结果与基准算法完全一致。标准 BMP 测试图均低于 300ms；`test1.jpg` 解码后约 4476 万像素，本轮平均 `313.04ms`，最小值 `288.90ms`，因此不能宣称对该超大图稳定低于 300ms。

## 保留与未采用维度

已保留为自动候选：

- `directGray` / `lookupGray`：都保持标准公式结果一致。
- `normalLoop` / `unroll4`：覆盖普通循环和有效循环展开。
- `mainThread` / `fixed4Worker`：覆盖低开销主线程和大图并行计算。

已测试但不作为自动候选：

- `histArray`：性能不稳定，降级为对照项。
- `unroll2` / `unroll8`：没有稳定优于 `unroll4`。
- `singleWorker` / `chunkWorker` / `fixed2Worker`：通信和复制成本导致整体不如保留方案。
- `includeImageData`：生成渲染数据会增加耗时，默认只返回 `normalizedBins`。

## Worker 可能不如主线程快的原因

Worker 计算需要创建线程、复制或转移像素数据、等待消息通信，并在多 Worker 场景合并 256 个 bin。小图和中图的像素量不足以抵消这些固定成本，因此主线程查表方案通常更快。大图像素量足够大时，并行计算收益才会超过通信成本。

## 后续优化方向

- 使用更稳定的测试环境记录多轮 benchmark，减少浏览器后台任务干扰。
- 针对超大图缓存 Worker，降低重复创建成本。
- 评估 OffscreenCanvas 或 WebAssembly，但必须继续保持标准灰度公式和 256 个 bin 完全一致。
