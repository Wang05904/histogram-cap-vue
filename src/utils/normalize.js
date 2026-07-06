/**
 * 将256位计数数组归一化到 0~100，适配256*100画布
 * @param {number[]} countArr 灰度计数值
 * @returns number[] 归一化后数组
 */
export function normalizeHist(countArr) {
    const maxVal = Math.max(...countArr)
    if (maxVal === 0) return countArr.fill(0)
    return countArr.map(item => (item / maxVal) * 100)
  }