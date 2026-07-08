export const ERROR_TYPES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DECODE_FAILED: 'DECODE_FAILED',
  UNSUPPORTED_FILE: 'UNSUPPORTED_FILE',
  CANVAS_UNAVAILABLE: 'CANVAS_UNAVAILABLE',
  WORKER_FAILED: 'WORKER_FAILED',
  SAVE_FAILED: 'SAVE_FAILED',
  NO_RESULT: 'NO_RESULT',
  UNKNOWN: 'UNKNOWN'
}

const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'webp']

const ERROR_MESSAGES = {
  [ERROR_TYPES.PERMISSION_DENIED]: {
    title: '权限被拒绝',
    message: '当前操作需要读取或保存权限，请在系统设置中允许后重试。'
  },
  [ERROR_TYPES.DECODE_FAILED]: {
    title: '图片解码失败',
    message: '图片文件可能已损坏，或当前浏览器不支持该图片格式。'
  },
  [ERROR_TYPES.UNSUPPORTED_FILE]: {
    title: '文件类型不支持',
    message: '请选择 JPG、PNG、BMP 或 WEBP 图片文件。'
  },
  [ERROR_TYPES.CANVAS_UNAVAILABLE]: {
    title: 'Canvas 不可用',
    message: '无法创建图像处理画布，请刷新页面或更换运行环境后重试。'
  },
  [ERROR_TYPES.WORKER_FAILED]: {
    title: '并行计算失败',
    message: 'Worker 计算过程异常，可重试或切换到基准算法。'
  },
  [ERROR_TYPES.SAVE_FAILED]: {
    title: '保存失败',
    message: '结果图片未能保存，请检查浏览器下载权限或设备存储空间。'
  },
  [ERROR_TYPES.NO_RESULT]: {
    title: '暂无结果',
    message: '请先生成直方图，再保存结果图片。'
  },
  [ERROR_TYPES.UNKNOWN]: {
    title: '操作失败',
    message: '发生未知错误，请重试或更换图片。'
  }
}

export function createAppError(type, detail = '', cause = null) {
  const error = new Error(detail || ERROR_MESSAGES[type]?.message || ERROR_MESSAGES.UNKNOWN.message)
  error.code = type
  error.cause = cause
  return error
}

export function isSupportedImageFile(file) {
  if (!file) {
    return false
  }

  if (file.type) {
    return file.type.startsWith('image/')
  }

  const extension = file.name?.split('.').pop()?.toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(extension)
}

export function validateImageFile(file) {
  if (!isSupportedImageFile(file)) {
    throw createAppError(ERROR_TYPES.UNSUPPORTED_FILE)
  }
}

export function normalizeError(error, fallbackType = ERROR_TYPES.UNKNOWN) {
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return error.code
  }

  const message = String(error?.message || error || '').toLowerCase()

  if (message.includes('permission') || message.includes('denied') || message.includes('not allowed')) {
    return ERROR_TYPES.PERMISSION_DENIED
  }

  if (message.includes('decode') || message.includes('load image') || message.includes('image')) {
    return ERROR_TYPES.DECODE_FAILED
  }

  if (message.includes('canvas') || message.includes('getimagedata') || message.includes('2d context')) {
    return ERROR_TYPES.CANVAS_UNAVAILABLE
  }

  if (message.includes('worker')) {
    return ERROR_TYPES.WORKER_FAILED
  }

  if (message.includes('save') || message.includes('writefile') || message.includes('filesystem')) {
    return ERROR_TYPES.SAVE_FAILED
  }

  return fallbackType
}

export function getFriendlyError(error, fallbackType = ERROR_TYPES.UNKNOWN) {
  const type = normalizeError(error, fallbackType)
  const base = ERROR_MESSAGES[type] || ERROR_MESSAGES.UNKNOWN

  return {
    type,
    title: base.title,
    message: base.message,
    detail: error?.message || ''
  }
}

export function formatErrorMessage(error, fallbackType = ERROR_TYPES.UNKNOWN) {
  const friendly = getFriendlyError(error, fallbackType)
  return `${friendly.title}：${friendly.message}`
}
