export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    image.src = src
  })
}

export async function imagePathToImageData(src) {
  if (typeof document === 'undefined') {
    throw new Error('imagePathToImageData requires a browser canvas environment')
  }

  const image = await loadImageElement(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Unable to create 2D canvas context')
  }

  context.drawImage(image, 0, 0)

  return {
    name: src.split('/').pop() || src,
    imageData: context.getImageData(0, 0, canvas.width, canvas.height),
    width: canvas.width,
    height: canvas.height
  }
}

export function fileToImageData(file) {
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
