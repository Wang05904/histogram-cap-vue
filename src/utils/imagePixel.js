import {
  createAppError,
  ERROR_TYPES,
  MAX_IMAGE_PIXELS,
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

  if (canvas.width * canvas.height > MAX_IMAGE_PIXELS) {
    throw createAppError(ERROR_TYPES.IMAGE_TOO_LARGE, 'Image dimensions exceed the safe processing limit')
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
    throw createAppError(ERROR_TYPES.IMAGE_TOO_LARGE, 'Unable to read image pixels from canvas', error)
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

export default {
  fileToImageData,
  imagePathToImageData,
  loadImageElement
}
