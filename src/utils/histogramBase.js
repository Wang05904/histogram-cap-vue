const BIN_COUNT = 256
const HISTOGRAM_HEIGHT = 100

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

export function normalizeBins(bins, OutputType = Uint8Array) {
  const start = now()
  let max = 0

  for (let i = 0; i < BIN_COUNT; i++) {
    if (bins[i] > max) {
      max = bins[i]
    }
  }

  const normalizedBins = new OutputType(BIN_COUNT)

  if (max > 0) {
    for (let i = 0; i < BIN_COUNT; i++) {
      normalizedBins[i] = Math.round((bins[i] / max) * HISTOGRAM_HEIGHT)
    }
  }

  return {
    normalizedBins,
    normalizeMs: Number((now() - start).toFixed(3)),
    maxBinCount: max
  }
}

export function createHistogramImageData(normalizedBins) {
  const start = now()
  const width = BIN_COUNT
  const height = HISTOGRAM_HEIGHT
  const pixels = new Uint8ClampedArray(width * height * 4)

  for (let x = 0; x < width; x++) {
    const barHeight = Math.max(0, Math.min(HISTOGRAM_HEIGHT, normalizedBins[x] || 0))

    for (let y = 0; y < height; y++) {
      const offset = (y * width + x) * 4
      const isBar = y >= height - barHeight
      const value = isBar ? 0 : 255

      pixels[offset] = value
      pixels[offset + 1] = value
      pixels[offset + 2] = value
      pixels[offset + 3] = 255
    }
  }

  const histogramImageData =
    typeof ImageData !== 'undefined'
      ? new ImageData(pixels, width, height)
      : { data: pixels, width, height }

  return {
    histogramImageData,
    dataGenerateMs: Number((now() - start).toFixed(3))
  }
}

export function runBaseHistogram(imageData, options = {}) {
  if (!imageData?.data) {
    throw new Error('runBaseHistogram requires ImageData')
  }

  const computeStart = now()
  const data = imageData.data
  const bins = new Uint32Array(BIN_COUNT)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
    bins[gray]++
  }

  const computeMs = Number((now() - computeStart).toFixed(3))
  const normalized = normalizeBins(bins, Uint8Array)
  const generated = options.includeImageData
    ? createHistogramImageData(normalized.normalizedBins)
    : { histogramImageData: null, dataGenerateMs: 0 }

  const totalMs = Number(
    (computeMs + normalized.normalizeMs + generated.dataGenerateMs).toFixed(3)
  )

  return {
    algorithmName: 'baseline-float-normal-array',
    config: {
      grayMode: 'floatGray',
      loopMode: 'normalLoop',
      dataMode: 'histTypedArray',
      threadMode: 'mainThread'
    },
    bins,
    normalizedBins: normalized.normalizedBins,
    histogramImageData: generated.histogramImageData,
    timing: {
      computeMs,
      normalizeMs: normalized.normalizeMs,
      dataGenerateMs: generated.dataGenerateMs,
      totalMs
    },
    width: imageData.width,
    height: imageData.height,
    pixelCount: imageData.width * imageData.height
  }
}

export function calcBaseHistogram(imageData) {
  return Array.from(runBaseHistogram(imageData).bins)
}

export default {
  calcBaseHistogram,
  createHistogramImageData,
  normalizeBins,
  runBaseHistogram
}
