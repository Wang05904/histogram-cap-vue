import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

import { createAppError, ERROR_TYPES } from '@/utils/errorHandler.js'
import { loadImageElement } from '@/utils/imagePixel.js'

const HISTOGRAM_WIDTH = 256
const HISTOGRAM_HEIGHT = 100
const MARKED_IMAGE_MAX_EDGE = 2048

function requireCanvas() {
  if (typeof document === 'undefined') {
    throw createAppError(ERROR_TYPES.CANVAS_UNAVAILABLE)
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw createAppError(ERROR_TYPES.CANVAS_UNAVAILABLE)
  }

  return { canvas, context }
}

function toPngDataUrl(canvas) {
  try {
    return canvas.toDataURL('image/png')
  } catch (error) {
    throw createAppError(ERROR_TYPES.SAVE_FAILED, 'PNG 导出失败', error)
  }
}

function dataUrlToBase64(dataUrl) {
  const [, data] = dataUrl.split(',')

  if (!data) {
    throw createAppError(ERROR_TYPES.SAVE_FAILED, '图片数据格式无效')
  }

  return data
}

function safeFileName(name) {
  return String(name || 'histogram-result')
    .replace(/\.[^.]+$/, '')
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'histogram-result'
}

export function createExportFileName(sourceName, suffix = 'histogram') {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${safeFileName(sourceName)}-${suffix}-${stamp}.png`
}

export function buildHistogramPng(normalizedBins) {
  if (!Array.isArray(normalizedBins) && !(normalizedBins instanceof Uint8Array)) {
    throw createAppError(ERROR_TYPES.NO_RESULT)
  }

  const { canvas, context } = requireCanvas()
  canvas.width = HISTOGRAM_WIDTH
  canvas.height = HISTOGRAM_HEIGHT

  const pixels = context.createImageData(HISTOGRAM_WIDTH, HISTOGRAM_HEIGHT)

  for (let x = 0; x < HISTOGRAM_WIDTH; x++) {
    const barHeight = Math.max(0, Math.min(100, Number(normalizedBins[x] || 0)))

    for (let y = 0; y < HISTOGRAM_HEIGHT; y++) {
      const offset = (y * HISTOGRAM_WIDTH + x) * 4
      const value = y >= HISTOGRAM_HEIGHT - barHeight ? 0 : 255

      pixels.data[offset] = value
      pixels.data[offset + 1] = value
      pixels.data[offset + 2] = value
      pixels.data[offset + 3] = 255
    }
  }

  context.putImageData(pixels, 0, 0)
  return toPngDataUrl(canvas)
}

export async function buildMarkedOriginalPng(imageUrl, status = {}) {
  if (!imageUrl) {
    throw createAppError(ERROR_TYPES.NO_RESULT)
  }

  const image = await loadImageElement(imageUrl)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const scale = Math.min(1, MARKED_IMAGE_MAX_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const { canvas, context } = requireCanvas()
  canvas.width = width
  canvas.height = height

  context.drawImage(image, 0, 0, width, height)

  const lines = [
    status.passed300ms ? '< 300ms' : '>= 300ms',
    status.sameAsBaseline ? '结果一致' : '结果需复核',
    status.algorithmName || '未记录算法'
  ]

  const padding = Math.max(12, Math.round(width * 0.012))
  const fontSize = Math.max(14, Math.min(26, Math.round(width * 0.018)))
  context.font = `${fontSize}px sans-serif`

  const textWidth = Math.max(...lines.map((line) => context.measureText(line).width))
  const boxWidth = Math.min(width - padding * 2, Math.ceil(textWidth + padding * 2))
  const lineHeight = Math.round(fontSize * 1.45)
  const boxHeight = lineHeight * lines.length + padding
  const x = width - boxWidth - padding
  const y = padding

  context.fillStyle = status.sameAsBaseline ? 'rgba(22, 101, 52, 0.82)' : 'rgba(180, 83, 9, 0.86)'
  context.fillRect(x, y, boxWidth, boxHeight)

  context.fillStyle = '#ffffff'
  lines.forEach((line, index) => {
    context.fillText(line, x + padding, y + padding + fontSize + index * lineHeight)
  })

  return toPngDataUrl(canvas)
}

export async function saveImageFile(dataUrl, filename) {
  if (!dataUrl) {
    throw createAppError(ERROR_TYPES.NO_RESULT)
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const result = await Filesystem.writeFile({
        path: filename,
        data: dataUrlToBase64(dataUrl),
        directory: Directory.Documents,
        recursive: true
      })

      return {
        platform: 'native',
        path: result.uri || filename
      }
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()

    return {
      platform: 'web',
      path: filename
    }
  } catch (error) {
    throw createAppError(ERROR_TYPES.SAVE_FAILED, '图片保存失败', error)
  }
}
