import { normalizeBins } from './histogramBase.js'

function assertHistogram(histogram) {
  if (!histogram || histogram.length !== 256) {
    throw new Error('Histogram data must contain 256 bins')
  }
}

export function normalizeHistogram(histogram) {
  assertHistogram(histogram)
  return Array.from(normalizeBins(histogram, Uint8Array).normalizedBins)
}

export function computeHistogram(imageData, algorithm = 'realtime') {
  if (!imageData?.data) {
    throw new Error('computeHistogram requires ImageData')
  }

  const data = imageData.data
  const histogram = new Uint32Array(256)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const gray =
      algorithm === 'int'
        ? (77 * r + 150 * g + 29 * b) >> 8
        : Math.round(r * 0.299 + g * 0.587 + b * 0.114)

    histogram[gray]++
  }

  return Array.from(histogram)
}

export function getHistogramStats(histogram) {
  assertHistogram(histogram)

  let totalPixels = 0
  let maxCount = 0
  let peakGray = 0

  for (let i = 0; i < histogram.length; i++) {
    totalPixels += histogram[i]

    if (histogram[i] > maxCount) {
      maxCount = histogram[i]
      peakGray = i
    }
  }

  return {
    totalPixels,
    maxCount,
    peakGray,
    peakCount: maxCount
  }
}

export default {
  normalizeHistogram,
  computeHistogram,
  getHistogramStats
}
