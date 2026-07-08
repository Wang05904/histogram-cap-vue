import {
  createHistogramImageData,
  normalizeBins,
  runBaseHistogram
} from './histogramBase.js'

const DEFAULT_CONFIG = {
  grayMode: 'floatGray',
  grayStrategy: 'directGray',
  loopMode: 'unroll4',
  dataMode: 'histTypedArray',
  threadMode: 'mainThread'
}

export const FASTEST_KNOWN_CONFIG = {
  grayMode: 'floatGray',
  grayStrategy: 'directGray',
  loopMode: 'unroll4',
  dataMode: 'histTypedArray',
  threadMode: 'mainThread'
}

const GRAY_TABLES = (() => {
  const r = new Float64Array(256)
  const g = new Float64Array(256)
  const b = new Float64Array(256)

  for (let i = 0; i < 256; i++) {
    r[i] = i * 0.299
    g[i] = i * 0.587
    b[i] = i * 0.114
  }

  return { r, g, b }
})()

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function buildAlgorithmName(config) {
  const parts = [
    config.threadMode,
    config.grayStrategy || 'directGray',
    config.loopMode,
    config.dataMode
  ]

  if (config.chunkSize) {
    parts.push(`chunk${config.chunkSize}`)
  }

  if (config.workerCount) {
    parts.push(`workers${config.workerCount}`)
  }

  return parts.join('-')
}

function createBins(dataMode) {
  return dataMode === 'histArray' ? new Array(256).fill(0) : new Uint32Array(256)
}

function getGray(data, i, grayStrategy) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]

  if (grayStrategy === 'lookupGray') {
    return Math.round(GRAY_TABLES.r[r] + GRAY_TABLES.g[g] + GRAY_TABLES.b[b])
  }

  return Math.round(r * 0.299 + g * 0.587 + b * 0.114)
}

function addPixel(data, bins, i, grayStrategy) {
  bins[getGray(data, i, grayStrategy)]++
}

function computeNormalLoop(data, bins, grayStrategy) {
  for (let i = 0; i < data.length; i += 4) {
    addPixel(data, bins, i, grayStrategy)
  }
}

function computeUnrolledLoop(data, bins, grayStrategy, pixelStep) {
  const byteStep = pixelStep * 4
  const limit = data.length - byteStep + 1
  let i = 0

  for (; i <= limit; i += byteStep) {
    for (let offset = 0; offset < byteStep; offset += 4) {
      addPixel(data, bins, i + offset, grayStrategy)
    }
  }

  for (; i < data.length; i += 4) {
    addPixel(data, bins, i, grayStrategy)
  }
}

function loopPixelStep(loopMode) {
  if (loopMode === 'unroll2') {
    return 2
  }

  if (loopMode === 'unroll8') {
    return 8
  }

  if (loopMode === 'unrolledLoop' || loopMode === 'unroll4') {
    return 4
  }

  return 1
}

function computeMainThread(imageData, config) {
  const start = now()
  const bins = createBins(config.dataMode)
  const data = imageData.data
  const pixelStep = loopPixelStep(config.loopMode)
  const grayStrategy = config.grayStrategy || 'directGray'

  if (pixelStep > 1) {
    computeUnrolledLoop(data, bins, grayStrategy, pixelStep)
  } else {
    computeNormalLoop(data, bins, grayStrategy)
  }

  return {
    bins: bins instanceof Uint32Array ? bins : Uint32Array.from(bins),
    computeMs: Number((now() - start).toFixed(3))
  }
}

function runWorker(buffer, config) {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('WebWorker is not available in this environment'))
      return
    }

    const worker = new Worker(
      new URL('../workers/pixelCalc.worker.js', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (event) => {
      worker.terminate()
      resolve({
        bins: new Uint32Array(event.data.bins),
        computeMs: event.data.timing.computeMs
      })
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(event.error || new Error(event.message))
    }

    worker.postMessage({ buffer, config }, [buffer])
  })
}

async function computeSingleWorker(imageData, config) {
  return runWorker(imageData.data.slice().buffer, config)
}

async function computeMultiWorker(imageData, config) {
  if (typeof navigator === 'undefined' || typeof Worker === 'undefined') {
    return computeSingleWorker(imageData, config)
  }

  const pixelCount = imageData.width * imageData.height
  const requestedWorkers =
    config.workerCount ||
    (config.threadMode === 'fixed2Worker' ? 2 : config.threadMode === 'fixed4Worker' ? 4 : 0)
  const maxWorkers = requestedWorkers || Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1))
  const workerCount = Math.min(maxWorkers, Math.max(1, Math.floor(pixelCount / 65536)))

  if (workerCount <= 1) {
    return computeSingleWorker(imageData, config)
  }

  const start = now()
  const tasks = []

  for (let i = 0; i < workerCount; i++) {
    const startPixel = Math.floor((pixelCount * i) / workerCount)
    const endPixel = Math.floor((pixelCount * (i + 1)) / workerCount)
    const chunk = imageData.data.slice(startPixel * 4, endPixel * 4)

    tasks.push(runWorker(chunk.buffer, config))
  }

  const parts = await Promise.all(tasks)
  const bins = new Uint32Array(256)

  for (const part of parts) {
    for (let i = 0; i < 256; i++) {
      bins[i] += part.bins[i]
    }
  }

  return {
    bins,
    computeMs: Number((now() - start).toFixed(3))
  }
}

export function compareHistogramBins(candidateBins, baselineBins, tolerance = 0) {
  let maxBinDiff = 0
  let totalDiff = 0

  for (let i = 0; i < 256; i++) {
    const diff = Math.abs((candidateBins[i] || 0) - (baselineBins[i] || 0))
    totalDiff += diff

    if (diff > maxBinDiff) {
      maxBinDiff = diff
    }
  }

  return {
    sameAsBaseline: totalDiff === 0,
    withinTolerance: totalDiff <= tolerance,
    maxBinDiff,
    totalDiff
  }
}

export function runBaseHistogramInterface(imageData, options = {}) {
  return runBaseHistogram(imageData, options)
}

export { runBaseHistogram }

export async function runOptimizedHistogram(imageData, options = {}) {
  if (!imageData?.data) {
    throw new Error('runOptimizedHistogram requires ImageData')
  }

  const config = { ...DEFAULT_CONFIG, ...options }
  let computed

  if (config.threadMode === 'singleWorker' || config.threadMode === 'chunkWorker') {
    computed = await computeSingleWorker(imageData, config)
  } else if (
    config.threadMode === 'multiWorker' ||
    config.threadMode === 'fixed2Worker' ||
    config.threadMode === 'fixed4Worker'
  ) {
    computed = await computeMultiWorker(imageData, config)
  } else {
    computed = computeMainThread(imageData, config)
  }

  const normalized = normalizeBins(computed.bins, Uint8Array)
  const generated = config.includeImageData
    ? createHistogramImageData(normalized.normalizedBins)
    : { histogramImageData: null, dataGenerateMs: 0 }
  const totalMs = Number(
    (computed.computeMs + normalized.normalizeMs + generated.dataGenerateMs).toFixed(3)
  )

  return {
    algorithmName: buildAlgorithmName(config),
    config,
    bins: computed.bins,
    normalizedBins: normalized.normalizedBins,
    histogramImageData: generated.histogramImageData,
    timing: {
      computeMs: computed.computeMs,
      normalizeMs: normalized.normalizeMs,
      dataGenerateMs: generated.dataGenerateMs,
      totalMs
    },
    width: imageData.width,
    height: imageData.height,
    pixelCount: imageData.width * imageData.height
  }
}

export async function runFastestHistogram(imageData, options = {}) {
  const baseline = runBaseHistogram(imageData)
  const module = await import('./histogramBenchmark.js')
  const rows = await module.benchmarkHistogramAlgorithms(
    [{ name: options.name || 'Current Image', imageData }],
    { runs: options.runs || 5, configs: options.configs }
  )
  const best = module.chooseBestAlgorithm(rows)

  if (!best) {
    throw new Error('No exact histogram algorithm matched the baseline')
  }

  const result = await runOptimizedHistogram(imageData, best.config)
  const accuracy = compareHistogramBins(result.bins, baseline.bins)

  return {
    ...result,
    passed300ms: result.timing.totalMs < 300,
    accuracy,
    selectionReason:
      'Selected from exact benchmark candidates for the current image; histArray, unroll2, and unroll8 are benchmark-only comparison items.',
    benchmarkSummary: {
      selectedAverageMs: best.timing.totalMs,
      candidateCount: rows.filter((row) => row.autoCandidate).length
    },
    histogram: {
      bins: Array.from(result.bins),
      normalizedBins: Array.from(result.normalizedBins)
    }
  }
}

export async function benchmarkHistogramAlgorithms(imageDataList, options = {}) {
  const module = await import('./histogramBenchmark.js')
  return module.benchmarkHistogramAlgorithms(imageDataList, options)
}

export default {
  benchmarkHistogramAlgorithms,
  compareHistogramBins,
  runBaseHistogram,
  runFastestHistogram,
  runOptimizedHistogram
}
