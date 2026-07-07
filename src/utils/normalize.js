/**
 * 将直方图数据归一化到0~100范围
 * @param {number[]} histogram - 长度为256的直方图数据
 * @returns {number[]} 归一化后的数据，长度256，范围0~100
 */
export function normalizeHistogram(histogram) {
  if (!Array.isArray(histogram) || histogram.length !== 256) {
    throw new Error('直方图数据必须为长度为256的数组')
  }

  // 1. 找到最大值
  let maxVal = 0
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > maxVal) {
      maxVal = histogram[i]
    }
  }

  // 2. 如果最大值为0，返回全0数组
  if (maxVal === 0) {
    return new Array(256).fill(0)
  }

  // 3. 归一化到0~100
  const normalized = new Array(256)
  for (let i = 0; i < histogram.length; i++) {
    // 使用线性归一化: (value / maxVal) * 100
    normalized[i] = (histogram[i] / maxVal) * 100
  }

  return normalized
}

/**
 * 计算灰度直方图（从图像数据）
 * @param {ImageData} imageData - 图像数据
 * @param {string} algorithm - 算法类型 'pre' | 'realtime'
 * @returns {number[]} 长度为256的直方图数据
 */
export function computeHistogram(imageData, algorithm = 'realtime') {
  const data = imageData.data
  const histogram = new Array(256).fill(0)

  if (algorithm === 'pre') {
    // 预灰度化：先计算每个像素的灰度值，再统计
    for (let i = 0; i < data.length; i += 4) {
      // 加权灰度公式: 0.299*R + 0.587*G + 0.114*B
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      histogram[gray]++
    }
  } else {
    // realtime：统计时灰度化（直接使用R通道作为灰度，或使用其他快速方法）
    for (let i = 0; i < data.length; i += 4) {
      // 简单平均灰度: (R + G + B) / 3
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3)
      histogram[gray]++
    }
  }

  return histogram
}

/**
 * 获取直方图统计信息
 * @param {number[]} histogram - 长度为256的直方图数据
 * @returns {Object} 统计信息
 */
export function getHistogramStats(histogram) {
  if (!Array.isArray(histogram) || histogram.length !== 256) {
    throw new Error('直方图数据必须为长度为256的数组')
  }

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