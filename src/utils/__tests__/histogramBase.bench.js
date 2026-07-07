import { bench, describe } from 'vitest'

import { calcBaseHistogram } from '@/utils/histogramBase'

import { createRandomImageData } from './helpers'

/**
 * 单线程基准算法性能基准测试
 *
 * 运行： npm run bench
 *
 * 各尺寸图片使用固定随机像素预生成，避免把数据构造时间计入基准。
 * 结果可作为后续 WebWorker 多线程优化算法（histogramOpt.js）的对比基线。
 */

// 预生成不同尺寸的图像数据（构造成本不计入基准）
const small = createRandomImageData(100, 100) // 1 万像素
const medium = createRandomImageData(800, 600) // 48 万像素
const large = createRandomImageData(1920, 1080) // 约 207 万像素
const huge = createRandomImageData(4000, 3000) // 1200 万像素

describe('calcBaseHistogram 性能基准', () => {
  bench('小图 100x100 (10K 像素)', () => {
    calcBaseHistogram(small)
  })

  bench('中图 800x600 (480K 像素)', () => {
    calcBaseHistogram(medium)
  })

  bench('大图 1920x1080 (2M 像素)', () => {
    calcBaseHistogram(large)
  })

  bench('超大图 4000x3000 (12M 像素)', () => {
    calcBaseHistogram(huge)
  })
})
