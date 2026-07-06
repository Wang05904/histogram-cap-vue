// 接收主线程发送的像素块数据，分块并行计算灰度统计
self.onmessage = (e) => {
    const { data, start, end } = e.data
    const count = new Uint32Array(256).fill(0)
    for (let i = start; i < end; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)
      count[gray]++
    }
    self.postMessage(Array.from(count))
  }