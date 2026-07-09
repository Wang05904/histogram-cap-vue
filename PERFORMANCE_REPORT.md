# 直方图性能报告

## 测试环境

- 项目：Vue 3 + Vite + Capacitor
- 运行方式：Vite 浏览器环境，`http://127.0.0.1:5173`
- 测试方式：每个组合运行 6 次，丢弃第 1 次冷启动结果，统计后 5 次平均值。
- 构建验证：`npm run build` 已通过。

## 测试图片

本轮使用 `public/image` 中 6 张图片：

| 图片 | 尺寸 | 像素数 |
|---|---:|---:|
| lena256.bmp | 256x256 | 65,536 |
| avion.bmp | 512x512 | 262,144 |
| fruit.bmp | 512x512 | 262,144 |
| Goldhill.bmp | 512x512 | 262,144 |
| boats.bmp | 1024x1024 | 1,048,576 |
| test1.jpg | 5464x8192 | 44,761,088 |

## 算法组合说明

所有组合固定使用题目要求的灰度公式：

```js
gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
```

`intGray` 已删除。`includeImageData` 已从 benchmark 组合中删除，自动最快只比较直方图统计与归一化耗时，页面绘制仍使用 `normalizedBins` 或按需生成渲染数据。

## 当前自动候选

自动最快会从以下正确候选中选择：

- 灰度策略：`directGray`、`lookupGray`
- 遍历策略：`normalLoop`、`unroll4`
- 数据结构：`histArray`、`histTypedArray`
- 线程策略：`mainThread`、`singleWorker`、`chunkWorker`、`fixed2Worker`、`fixed4Worker`

仍作为对照项、不参与自动选择：

- `unroll2`
- `unroll8`

当前版本已把 `histArray` 重新纳入自动候选，并额外展示多组普通数组与 TypedArray 对照结果，便于观察数据结构维度对当前图片的实际影响。

## 每张图片最快正确组合

| 算法组合 | 图片 | 尺寸 | 像素数 | 计算耗时 | 归一化耗时 | 数据生成耗时 | 总耗时 | 平均耗时 | 是否低于300ms | 是否与基准一致 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| mainThread-lookupGray-unroll4-histTypedArray | lena256.bmp | 256x256 | 65,536 | 1.06ms | 0.00ms | 0.00ms | 1.06ms | 1.06ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | avion.bmp | 512x512 | 262,144 | 4.34ms | 0.00ms | 0.00ms | 4.34ms | 4.34ms | 是 | 是 |
| mainThread-lookupGray-unroll4-histTypedArray | fruit.bmp | 512x512 | 262,144 | 4.44ms | 0.00ms | 0.00ms | 4.44ms | 4.44ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | Goldhill.bmp | 512x512 | 262,144 | 2.60ms | 0.00ms | 0.00ms | 2.60ms | 2.60ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | boats.bmp | 1024x1024 | 1,048,576 | 17.62ms | 0.00ms | 0.00ms | 17.62ms | 17.62ms | 是 | 是 |
| fixed4Worker-directGray-unroll4-histTypedArray-workers4 | test1.jpg | 5464x8192 | 44,761,088 | 247.88ms | 0.00ms | 0.00ms | 247.88ms | 247.88ms | 是 | 是 |

## 组合平均结果

| 算法组合 | 平均耗时 | 最小耗时 | 最大耗时 | 自动候选 | 是否与基准一致 |
|---|---:|---:|---:|---|---|
| fixed4Worker-directGray-unroll4-histTypedArray-workers4 | 53.700ms | 2.100ms | 252.600ms | 是 | 是 |
| fixed2Worker-directGray-unroll4-histTypedArray-workers2 | 82.890ms | 2.000ms | 441.900ms | 是 | 是 |
| mainThread-lookupGray-normalLoop-histTypedArray | 119.337ms | 1.000ms | 725.100ms | 是 | 是 |
| mainThread-lookupGray-unroll4-histTypedArray | 121.897ms | 1.000ms | 743.000ms | 是 | 是 |
| mainThread-directGray-normalLoop-histTypedArray | 122.627ms | 1.100ms | 741.500ms | 是 | 是 |
| chunkWorker-directGray-unroll4-histTypedArray-chunk262144 | 125.713ms | 2.000ms | 730.000ms | 是 | 是 |
| chunkWorker-directGray-unroll4-histTypedArray-chunk32768 | 127.013ms | 2.300ms | 754.200ms | 是 | 是 |
| mainThread-directGray-unroll4-histTypedArray | 128.217ms | 1.000ms | 784.800ms | 是 | 是 |
| singleWorker-directGray-unroll4-histTypedArray | 136.347ms | 2.000ms | 781.400ms | 是 | 是 |
| mainThread-directGray-normalLoop-histArray | 124.900ms | 1.100ms | 751.800ms | 是 | 是 |
| mainThread-directGray-unroll2-histTypedArray | 135.857ms | 1.100ms | 799.600ms | 否，对照项 | 是 |
| mainThread-directGray-unroll8-histTypedArray | 138.787ms | 0.900ms | 890.300ms | 否，对照项 | 是 |

## 当前最快正确组合

综合本轮 6 张图片，最快自动候选为：

```js
{
  grayStrategy: 'directGray',
  loopMode: 'unroll4',
  dataMode: 'histTypedArray',
  threadMode: 'fixed4Worker',
  workerCount: 4
}
```

平均耗时 `53.700ms`，所有测试结果与基准算法完全一致。`test1.jpg` 本轮平均 `247.88ms`，低于 300ms。

## 结论

- 小图和中图通常由 `mainThread + lookupGray` 胜出，因为没有 Worker 通信成本。
- 大图或超大图更适合 `fixed4Worker`，并行收益可以抵消数据传输和合并成本。
- `singleWorker`、`chunkWorker`、`fixed2Worker` 现在都参与自动候选，但本轮综合平均不如 `fixed4Worker`。
- `includeImageData` 不再作为 benchmark 维度，避免把渲染数据生成成本混入算法选择。
