import { describe, it, expect } from 'vitest'

import { calcBaseHistogram } from '@/utils/histogramBase'

import {
  createSolidImageData,
  createGrayRampImageData,
  createRandomImageData,
  BLACK_2x2,
  WHITE_2x2,
  RED_2x2,
  GREEN_2x2,
  BLUE_2x2
} from './helpers'

/**
 * 断言：直方图长度为 256，且总计数等于像素总数
 */
function expectValidHistogram(hist, totalPixels) {
  expect(Array.isArray(hist)).toBe(true)
  expect(hist).toHaveLength(256)
  const sum = hist.reduce((acc, v) => acc + v, 0)
  expect(sum).toBe(totalPixels)
}

describe('calcBaseHistogram - 单线程基准灰度直方图', () => {
  it('返回长度为 256 的数组', () => {
    const hist = calcBaseHistogram(BLACK_2x2)
    expect(hist).toHaveLength(256)
  })

  it('全黑图片：所有像素灰度为 0', () => {
    const hist = calcBaseHistogram(BLACK_2x2)
    expectValidHistogram(hist, 4)
    expect(hist[0]).toBe(4)
    // 其余灰度级均为 0
    expect(hist.slice(1).every((v) => v === 0)).toBe(true)
  })

  it('全白图片：所有像素灰度为 255', () => {
    const hist = calcBaseHistogram(WHITE_2x2)
    expectValidHistogram(hist, 4)
    // gray = round(255*0.299 + 255*0.587 + 255*0.114) = round(255) = 255
    expect(hist[255]).toBe(4)
  })

  it('纯红图片：灰度 = round(255 * 0.299) = 76', () => {
    const hist = calcBaseHistogram(RED_2x2)
    expectValidHistogram(hist, 4)
    expect(hist[76]).toBe(4)
  })

  it('纯绿图片：灰度 = round(255 * 0.587) = 150', () => {
    const hist = calcBaseHistogram(GREEN_2x2)
    expectValidHistogram(hist, 4)
    expect(hist[150]).toBe(4)
  })

  it('纯蓝图片：灰度 = round(255 * 0.114) = 29', () => {
    const hist = calcBaseHistogram(BLUE_2x2)
    expectValidHistogram(hist, 4)
    expect(hist[29]).toBe(4)
  })

  it('灰度渐变条：每个灰度级恰好 1 个像素', () => {
    const ramp = createGrayRampImageData()
    const hist = calcBaseHistogram(ramp)
    expectValidHistogram(hist, 256)
    // 每个灰度级都应为 1
    expect(hist.every((v) => v === 1)).toBe(true)
  })

  it('单像素图片：总计数为 1', () => {
    const single = createSolidImageData(1, 1, 100, 100, 100)
    const hist = calcBaseHistogram(single)
    expectValidHistogram(hist, 1)
    expect(hist[100]).toBe(1)
  })

  it('空数据（0x0）：返回全 0 数组', () => {
    const empty = createSolidImageData(0, 0, 0, 0, 0)
    const hist = calcBaseHistogram(empty)
    expect(hist).toHaveLength(256)
    expect(hist.every((v) => v === 0)).toBe(true)
  })

  it('大图像（1000x1000）：总计数等于像素总数', () => {
    const big = createRandomImageData(1000, 1000)
    const hist = calcBaseHistogram(big)
    expectValidHistogram(hist, 1_000_000)
  })

  it('灰度计算忽略 Alpha 通道', () => {
    // 构造带半透明 Alpha 的纯红像素，灰度仍应为 76
    const data = new Uint8ClampedArray([255, 0, 0, 128])
    const hist = calcBaseHistogram({ data, width: 1, height: 1 })
    expect(hist[76]).toBe(1)
  })
})
