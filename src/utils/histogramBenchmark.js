import { imagePathToImageData } from './imagePixel.js'
import { runBaseHistogram } from './histogramBase.js'
import {
  compareHistogramBins,
  runOptimizedHistogram
} from './histogramOpt.js'

export const TEST_IMAGE_PATHS = [
  '/image/avion.bmp',
  '/image/barba.bmp',
  '/image/boats.bmp',
  '/image/clown.bmp',
  '/image/fruit.bmp',
  '/image/Goldhill.bmp',
  '/image/house.bmp',
  '/image/isabe.bmp',
  '/image/lena256.bmp',
  '/image/lenat.bmp',
  '/image/mandr.bmp',
  '/image/pimen.bmp'
]

export const BENCHMARK_CONFIGS = [
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'normalLoop',
    dataMode: 'histArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'normalLoop',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'lookupGray',
    loopMode: 'normalLoop',
    dataMode: 'histArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'lookupGray',
    loopMode: 'normalLoop',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll2',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread',
    benchmarkOnly: true
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll8',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread',
    benchmarkOnly: true
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'lookupGray',
    loopMode: 'unroll4',
    dataMode: 'histArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'lookupGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'mainThread'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histArray',
    threadMode: 'singleWorker'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'singleWorker'
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'chunkWorker',
    chunkSize: 32768
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'chunkWorker',
    chunkSize: 262144
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'fixed2Worker',
    workerCount: 2
  },
  {
    grayMode: 'floatGray',
    grayStrategy: 'directGray',
    loopMode: 'unroll4',
    dataMode: 'histTypedArray',
    threadMode: 'fixed4Worker',
    workerCount: 4
  }
]

function algorithmName(config) {
  return [
    config.threadMode,
    config.grayStrategy || 'directGray',
    config.loopMode,
    config.dataMode,
    config.chunkSize ? `chunk${config.chunkSize}` : '',
    config.workerCount ? `workers${config.workerCount}` : '',
    config.includeImageData ? 'withImageData' : ''
  ].filter(Boolean).join('-')
}

function average(values) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function roundMs(value) {
  return Number(value.toFixed(3))
}

async function normalizeInput(input) {
  if (typeof input === 'string') {
    return imagePathToImageData(input)
  }

  if (input?.imageData) {
    return {
      name: input.name || 'ImageData',
      imageData: input.imageData,
      width: input.imageData.width,
      height: input.imageData.height
    }
  }

  if (input?.data) {
    return {
      name: input.name || 'ImageData',
      imageData: input,
      width: input.width,
      height: input.height
    }
  }

  throw new Error('Benchmark input must be an ImageData object, { name, imageData }, or image path')
}

async function runRepeated(imageData, config, runs) {
  const timings = []
  let lastResult = null

  for (let i = 0; i < runs + 1; i++) {
    const result = await runOptimizedHistogram(imageData, config)

    if (i > 0) {
      timings.push(result.timing)
    }

    lastResult = result
  }

  return { timings, lastResult }
}

export async function benchmarkHistogramAlgorithms(imageDataList = TEST_IMAGE_PATHS, options = {}) {
  const runs = options.runs || 5
  const configs = options.configs || BENCHMARK_CONFIGS
  const tolerance = options.tolerance ?? 0
  const inputs = Array.isArray(imageDataList) ? imageDataList : [imageDataList]
  const results = []

  for (const input of inputs) {
    const item = await normalizeInput(input)
    const baseline = runBaseHistogram(item.imageData)

    for (const config of configs) {
      const { timings, lastResult } = await runRepeated(item.imageData, config, runs)
      const totalTimes = timings.map((timing) => timing.totalMs)
      const computeTimes = timings.map((timing) => timing.computeMs)
      const normalizeTimes = timings.map((timing) => timing.normalizeMs)
      const dataGenerateTimes = timings.map((timing) => timing.dataGenerateMs)
      const accuracy = compareHistogramBins(lastResult.bins, baseline.bins, tolerance)
      const avgTotalMs = roundMs(average(totalTimes))

      results.push({
        algorithmName: algorithmName(config),
        imageName: item.name,
        width: item.width,
        height: item.height,
        size: `${item.width}x${item.height}`,
        pixelCount: item.width * item.height,
        grayMode: config.grayMode,
        loopMode: config.loopMode,
        dataMode: config.dataMode,
        threadMode: config.threadMode,
        computeMs: roundMs(average(computeTimes)),
        normalizeMs: roundMs(average(normalizeTimes)),
        dataGenerateMs: roundMs(average(dataGenerateTimes)),
        totalMs: avgTotalMs,
        averageMs: avgTotalMs,
        minMs: roundMs(Math.min(...totalTimes)),
        maxMs: roundMs(Math.max(...totalTimes)),
        passed300ms: avgTotalMs < 300,
        sameAsBaseline: accuracy.sameAsBaseline,
        withinTolerance: accuracy.withinTolerance,
        maxBinDiff: accuracy.maxBinDiff,
        totalDiff: accuracy.totalDiff,
        autoCandidate: !config.benchmarkOnly && accuracy.sameAsBaseline,
        config,
        lastTiming: lastResult.timing
      })
    }
  }

  return results
}

export function chooseBestAlgorithm(results, options = {}) {
  const tolerance = options.tolerance ?? 0
  const grouped = new Map()

  for (const result of results) {
    const item = grouped.get(result.algorithmName) || {
      algorithmName: result.algorithmName,
      config: result.config,
      rows: [],
      allExact: true,
      allWithinTolerance: true
    }

    item.rows.push(result)
    item.allExact = item.allExact && result.sameAsBaseline
    item.allWithinTolerance =
      item.allWithinTolerance && (result.sameAsBaseline || result.totalDiff <= tolerance)

    grouped.set(result.algorithmName, item)
  }

  const candidates = Array.from(grouped.values())
    .filter((group) => group.allExact && !group.config.benchmarkOnly)
    .map((group) => {
      const computeMs = roundMs(average(group.rows.map((row) => row.computeMs)))
      const normalizeMs = roundMs(average(group.rows.map((row) => row.normalizeMs)))
      const dataGenerateMs = roundMs(average(group.rows.map((row) => row.dataGenerateMs)))
      const totalMs = roundMs(average(group.rows.map((row) => row.averageMs)))
      const maxBinDiff = Math.max(...group.rows.map((row) => row.maxBinDiff))
      const totalDiff = group.rows.reduce((sum, row) => sum + row.totalDiff, 0)

      return {
        algorithmName: group.algorithmName,
        config: group.config,
        allExact: group.allExact,
        allWithinTolerance: group.allWithinTolerance,
        passed300ms: group.rows.every((row) => row.passed300ms),
        timing: {
          computeMs,
          normalizeMs,
          dataGenerateMs,
          totalMs
        },
        accuracy: {
          sameAsBaseline: group.allExact,
          maxBinDiff,
          totalDiff
        }
      }
    })
    .sort((a, b) => {
      if (a.allExact !== b.allExact) {
        return a.allExact ? -1 : 1
      }

      return a.timing.totalMs - b.timing.totalMs
    })

  if (!candidates.length) {
    return null
  }

  const best = candidates[0]

  return {
    algorithmName: best.algorithmName,
    config: best.config,
    timing: best.timing,
    passed300ms: best.passed300ms,
    accuracy: best.accuracy,
    note:
      'All automatic candidates use the required exact grayscale formula and match the baseline bins exactly.'
  }
}

export default {
  BENCHMARK_CONFIGS,
  TEST_IMAGE_PATHS,
  benchmarkHistogramAlgorithms,
  chooseBestAlgorithm
}
