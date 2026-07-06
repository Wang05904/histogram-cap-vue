/**
 * 标准灰度公式 gray = R*0.299 + G*0.587 + B*0.114
 * 单线程基准直方图计算
 * @param {ImageData} imgData 画布像素数据
 * @returns number[] 长度256灰度计数数组
 */
export function calcBaseHistogram(imgData) {
    const { data } = imgData
    const grayCount = new Uint32Array(256).fill(0)
  
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
      grayCount[gray]++
    }
    return Array.from(grayCount)
  }