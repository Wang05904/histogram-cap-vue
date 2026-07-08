import { describe, it, expect } from 'vitest'

import {
  normalizeHistogram,
  computeHistogram,
  getHistogramStats
} from '@/utils/normalize'

import { calcBaseHistogram } from '@/utils/histogramBase'

import {
  createSolidImageData,
  createGrayRampImageData,
  BLACK_2x2,
  WHITE_2x2
} from './helpers'

describe('normalizeHistogram - 归一化到 0~100', () => {
  it('全 0 输入：返回全 0 数组', () => {
    const result = normalizeHistogram(new Array(256).fill(0))
    expect(result).toHaveLength(256)
    expect(result.every((v) => v === 0)).toBe(true)
  })

  it('线性分布 hist[i]=i：归一化后最大值为 100', () => {
    const hist = Array.from({ length: 256 }, (_, i) => i)
    const result = normalizeHistogram(hist)
    // max = 255，normalized[i] = round(i / 255 * 100)
    expect(result[255]).toBe(100)
    expect(result[0]).toBe(0)
    expect(result[128]).toBe(Math.round((128 / 255) * 100))
  })

  it('单峰分布：峰值归一化为 100，其余按比例', () => {
    const hist = new Array(256).fill(0)
    hist[100] = 50
    hist[200] = 25
    const result = normalizeHistogram(hist)
    expect(result[100]).toBe(100)
    expect(result[200]).toBe(50)
    expect(result[0]).toBe(0)
  })

  it('所有值不超过 100', () => {
    const hist = Array.from({ length: 256 }, (_, i) => (i + 1) * 37)
    const result = normalizeHistogram(hist)
    expect(result.every((v) => v <= 100)).toBe(true)
  })

  it('非 256 长度输入：抛出错误', () => {
    expect(() => normalizeHistogram(new Array(255).fill(0))).toThrow()
    expect(() => normalizeHistogram([])).toThrow()
  })

  it('非数组输入：抛出错误', () => {
    expect(() => normalizeHistogram(null)).toThrow()
    expect(() => normalizeHistogram('not-array')).toThrow()
  })
})

describe('computeHistogram - 两种灰度化方式', () => {
  describe('pre（优先灰度化，加权公式）', () => {
    it('全黑图片：灰度 0 计数等于像素总数', () => {
      const hist = computeHistogram(BLACK_2x2, 'pre')
      expect(hist).toHaveLength(256)
      expect(hist[0]).toBe(4)
    })

    it('全白图片：灰度 255 计数等于像素总数', () => {
      const hist = computeHistogram(WHITE_2x2, 'pre')
      expect(hist[255]).toBe(4)
    })

    it('与 calcBaseHistogram 采用同一加权公式，结果一致', () => {
      const ramp = createGrayRampImageData()
      const base = calcBaseHistogram(ramp)
      const pre = computeHistogram(ramp, 'pre')
      expect(pre).toEqual(base)
    })
  })

  describe('realtime（统计时灰度化，标准加权公式）', () => {
    it('全黑图片：灰度 0 计数等于像素总数', () => {
      const hist = computeHistogram(BLACK_2x2, 'realtime')
      expect(hist[0]).toBe(4)
    })

    it('全白图片：标准加权灰度 = 255', () => {
      const hist = computeHistogram(WHITE_2x2, 'realtime')
      expect(hist[255]).toBe(4)
    })

    it('纯红图片：标准加权灰度 round(255 * 0.299) = 76', () => {
      const red = createSolidImageData(2, 2, 255, 0, 0)
      const hist = computeHistogram(red, 'realtime')
      expect(hist[76]).toBe(4)
    })

    it('缺省参数默认使用 realtime', () => {
      const red = createSolidImageData(2, 2, 255, 0, 0)
      const withDefault = computeHistogram(red)
      const explicit = computeHistogram(red, 'realtime')
      expect(withDefault).toEqual(explicit)
    })
  })

  it('总计数等于像素总数', () => {
    const img = createSolidImageData(10, 10, 123, 45, 67)
    expect(computeHistogram(img, 'pre').reduce((a, b) => a + b, 0)).toBe(100)
    expect(computeHistogram(img, 'realtime').reduce((a, b) => a + b, 0)).toBe(100)
  })
})

describe('getHistogramStats - 直方图统计信息', () => {
  it('识别峰值灰度与峰值计数', () => {
    const hist = new Array(256).fill(0)
    hist[128] = 500
    hist[64] = 200
    const stats = getHistogramStats(hist)
    expect(stats.peakGray).toBe(128)
    expect(stats.peakCount).toBe(500)
    expect(stats.maxCount).toBe(500)
    expect(stats.totalPixels).toBe(700)
  })

  it('全 0 输入：totalPixels/peakGray/peakCount 均为 0', () => {
    const stats = getHistogramStats(new Array(256).fill(0))
    expect(stats.totalPixels).toBe(0)
    expect(stats.peakGray).toBe(0)
    expect(stats.peakCount).toBe(0)
  })

  it('totalPixels 等于所有灰度级计数之和', () => {
    const ramp = createGrayRampImageData()
    const hist = calcBaseHistogram(ramp)
    const stats = getHistogramStats(hist)
    expect(stats.totalPixels).toBe(256)
  })

  it('非 256 长度输入：抛出错误', () => {
    expect(() => getHistogramStats(new Array(100).fill(0))).toThrow()
  })
})
