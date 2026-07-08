function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function createBins(dataMode) {
  return dataMode === 'histArray' ? new Array(256).fill(0) : new Uint32Array(256)
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

function grayValue(data, i, grayStrategy) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]

  if (grayStrategy === 'lookupGray') {
    return Math.round(GRAY_TABLES.r[r] + GRAY_TABLES.g[g] + GRAY_TABLES.b[b])
  }

  return Math.round(r * 0.299 + g * 0.587 + b * 0.114)
}

function addPixel(data, bins, i, grayStrategy) {
  bins[grayValue(data, i, grayStrategy)]++
}

function computeNormal(data, bins, grayStrategy) {
  for (let i = 0; i < data.length; i += 4) {
    addPixel(data, bins, i, grayStrategy)
  }
}

function computeUnrolled(data, bins, grayStrategy, pixelStep) {
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

function computeHistogram(data, config) {
  const bins = createBins(config.dataMode)
  const chunkSize = Math.max(4, (config.chunkSize || 65536) & ~3)
  const pixelStep = loopPixelStep(config.loopMode)
  const grayStrategy = config.grayStrategy || 'directGray'

  if (config.threadMode === 'chunkWorker') {
    for (let start = 0; start < data.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, data.length)
      const slice = data.subarray(start, end)

      if (pixelStep > 1) {
        computeUnrolled(slice, bins, grayStrategy, pixelStep)
      } else {
        computeNormal(slice, bins, grayStrategy)
      }
    }

    return bins
  }

  if (pixelStep > 1) {
    computeUnrolled(data, bins, grayStrategy, pixelStep)
  } else {
    computeNormal(data, bins, grayStrategy)
  }

  return bins
}

self.onmessage = (event) => {
  const { buffer, config } = event.data
  const data = new Uint8ClampedArray(buffer)
  const start = now()
  const bins = computeHistogram(data, config)
  const output = bins instanceof Uint32Array ? bins : Uint32Array.from(bins)
  const computeMs = Number((now() - start).toFixed(3))

  self.postMessage(
    {
      bins: output.buffer,
      timing: { computeMs }
    },
    [output.buffer]
  )
}
