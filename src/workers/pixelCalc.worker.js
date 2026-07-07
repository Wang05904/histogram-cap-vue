function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function createBins(dataMode) {
  return dataMode === 'histArray' ? new Array(256).fill(0) : new Uint32Array(256)
}

function grayValue(data, i, grayMode) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]

  if (grayMode === 'intGray') {
    return (77 * r + 150 * g + 29 * b) >> 8
  }

  return Math.round(r * 0.299 + g * 0.587 + b * 0.114)
}

function computeNormal(data, bins, grayMode) {
  for (let i = 0; i < data.length; i += 4) {
    bins[grayValue(data, i, grayMode)]++
  }
}

function computeUnrolled(data, bins, grayMode) {
  const limit = data.length - 15
  let i = 0

  for (; i <= limit; i += 16) {
    bins[grayValue(data, i, grayMode)]++
    bins[grayValue(data, i + 4, grayMode)]++
    bins[grayValue(data, i + 8, grayMode)]++
    bins[grayValue(data, i + 12, grayMode)]++
  }

  for (; i < data.length; i += 4) {
    bins[grayValue(data, i, grayMode)]++
  }
}

function computeHistogram(data, config) {
  const bins = createBins(config.dataMode)
  const chunkSize = Math.max(4, (config.chunkSize || 65536) & ~3)

  if (config.threadMode === 'chunkWorker') {
    for (let start = 0; start < data.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, data.length)
      const slice = data.subarray(start, end)

      if (config.loopMode === 'unrolledLoop') {
        computeUnrolled(slice, bins, config.grayMode)
      } else {
        computeNormal(slice, bins, config.grayMode)
      }
    }

    return bins
  }

  if (config.loopMode === 'unrolledLoop') {
    computeUnrolled(data, bins, config.grayMode)
  } else {
    computeNormal(data, bins, config.grayMode)
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
