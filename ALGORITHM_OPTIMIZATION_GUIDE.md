# Histogram Algorithm Optimization Guide

## Scope

This document describes the histogram optimization module for developers integrating or extending the calculation layer. The implementation is UI-independent and lives in `src/utils` and `src/workers`.

The required grayscale formula for exact mode is:

```js
gray = Math.round(red * 0.299 + green * 0.587 + blue * 0.114)
```

All algorithms return 256 raw bins and 256 normalized heights in the range `0..100`, suitable for a `256x100` black/white histogram renderer.

## Core Files

- `src/utils/histogramBase.js`: exact baseline algorithm and shared helpers.
- `src/utils/histogramOpt.js`: configurable optimized execution API.
- `src/utils/histogramBenchmark.js`: benchmark runner and fastest-correct selector.
- `src/utils/imagePixel.js`: browser image/file to `ImageData` helpers.
- `src/utils/normalize.js`: compatibility helpers for legacy callers.
- `src/workers/pixelCalc.worker.js`: worker-side histogram calculation.

## Algorithm Modes

### Grayscale

- `floatGray`: exact required formula. This is the correctness baseline.
- `intGray`: integer approximation, `(77 * r + 150 * g + 29 * b) >> 8`. It is faster but may place pixels into adjacent grayscale bins, so it is not the default exact mode.

### Loop Strategy

- `normalLoop`: standard `for` loop over RGBA data.
- `skipAlpha`: same RGBA stride, explicitly ignores alpha.
- `unrolledLoop`: processes four pixels per loop iteration to reduce loop overhead.

### Data Strategy

- `histArray`: plain `Array(256)`.
- `histTypedArray`: `Uint32Array(256)` for raw bins.
- `normalizedTypedArray`: `Uint8Array(256)` for normalized heights.

### Thread Strategy

- `mainThread`: direct calculation on the caller thread.
- `singleWorker`: one WebWorker.
- `chunkWorker`: chunked calculation inside one worker.
- `multiWorker`: splits work across a bounded number of workers and merges 256 bins.

## Public API

Import from `src/utils/histogramOpt.js`:

```js
import {
  runBaseHistogram,
  runOptimizedHistogram,
  runFastestHistogram,
  benchmarkHistogramAlgorithms
} from '@/utils/histogramOpt'
```

- `runBaseHistogram(imageData)`: exact baseline result.
- `runOptimizedHistogram(imageData, options)`: runs a selected strategy combination.
- `runFastestHistogram(imageData)`: runs the current fastest exact default.
- `benchmarkHistogramAlgorithms(imageDataList, options)`: compares strategy combinations.

Returned results include:

```js
{
  algorithmName,
  config,
  bins,
  normalizedBins,
  timing,
  histogramImageData
}
```

## Current Default

The selected fastest exact combination is:

```js
{
  grayMode: 'floatGray',
  loopMode: 'unrolledLoop',
  dataMode: 'histTypedArray',
  threadMode: 'mainThread'
}
```

It preserves exact baseline bins while improving runtime versus the normal loop baseline. See `算法结果报告.md` for benchmark data.

## Validation

Use:

```bash
npm run build
```

For browser benchmark validation, run the app and call `benchmarkHistogramAlgorithms()` with images from `public/image`.
