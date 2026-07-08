import {
  createAppError,
  ERROR_TYPES,
  validateImageFile
} from '@/utils/errorHandler.js'

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(createAppError(ERROR_TYPES.DECODE_FAILED, `Failed to load image: ${src}`))
    image.src = src
  })
}

export async function imagePathToImageData(src) {
  if (typeof document === 'undefined') {
    throw createAppError(ERROR_TYPES.CANVAS_UNAVAILABLE, 'imagePathToImageData requires a browser canvas environment')
  }

  const image = await loadImageElement(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  if (!canvas.width || !canvas.height) {
    throw createAppError(ERROR_TYPES.DECODE_FAILED, 'Invalid image size')
  }

  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw createAppError(ERROR_TYPES.CANVAS_UNAVAILABLE, 'Unable to create 2D canvas context')
  }

  try {
    context.drawImage(image, 0, 0)
  } catch (error) {
    throw createAppError(ERROR_TYPES.DECODE_FAILED, 'Unable to draw image on canvas', error)
  }

  let imageData

  try {
    imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  } catch (error) {
    throw createAppError(ERROR_TYPES.CANVAS_UNAVAILABLE, 'Unable to read image pixels from canvas', error)
  }

  return {
    name: src.split('/').pop() || src,
    imageData,
    width: canvas.width,
    height: canvas.height
  }
}

export function fileToImageData(file) {
  validateImageFile(file)

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)

    imagePathToImageData(url)
      .then((result) => {
        URL.revokeObjectURL(url)
        resolve({ ...result, name: file.name })
      })
      .catch((error) => {
        URL.revokeObjectURL(url)
        reject(error)
      })
  })
}


export function cropImageData(imageData, rect) {
  const x = Math.max(0, Math.round(rect.x))
  const y = Math.max(0, Math.round(rect.y))
  const w = Math.min(imageData.width - x, Math.max(1, Math.round(rect.width)))
  const h = Math.min(imageData.height - y, Math.max(1, Math.round(rect.height)))
  const cropped = new ImageData(w, h)
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcIdx = ((y + row) * imageData.width + (x + col)) * 4
      const dstIdx = (row * w + col) * 4
      cropped.data[dstIdx]     = imageData.data[srcIdx]
      cropped.data[dstIdx + 1] = imageData.data[srcIdx + 1]
      cropped.data[dstIdx + 2] = imageData.data[srcIdx + 2]
      cropped.data[dstIdx + 3] = imageData.data[srcIdx + 3]
    }
  }
  return { imageData: cropped, width: w, height: h }
}

export default {
  cropImageData,
  fileToImageData,
  imagePathToImageData,
  loadImageElement
}
