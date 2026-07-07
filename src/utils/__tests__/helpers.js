/**
 * 测试辅助工具：构造模拟 ImageData，供各算法测试用例共用
 *
 * 说明：Vitest 默认运行在 Node 环境，没有浏览器的 ImageData 类，
 * 因此这里用最小实现模拟 ImageData 的结构（data / width / height），
 * 满足直方图算法读取像素的需求。
 */

/**
 * 简易 ImageData 模拟对象
 * @param {Uint8ClampedArray} data - RGBA 像素数据
 * @param {number} width
 * @param {number} height
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
function makeImageData(data, width, height) {
  return { data, width, height }
}

/**
 * 使用像素工厂函数构造模拟 ImageData
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => {r: number, g: number, b: number, a?: number}} pixelFactory
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
export function createMockImageData(width, height, pixelFactory) {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const { r, g, b, a = 255 } = pixelFactory(x, y)
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = a
    }
  }

  return makeImageData(data, width, height)
}

/**
 * 构造纯色 ImageData
 * @param {number} width
 * @param {number} height
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
export function createSolidImageData(width, height, r, g, b) {
  return createMockImageData(width, height, () => ({ r, g, b }))
}

/**
 * 构造随机像素 ImageData（用于大图 / 基准测试）
 * @param {number} width
 * @param {number} height
 * @param {() => number} [rand] - 随机数生成器，默认 Math.random
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
export function createRandomImageData(width, height, rand = Math.random) {
  return createMockImageData(width, height, () => ({
    r: Math.floor(rand() * 256),
    g: Math.floor(rand() * 256),
    b: Math.floor(rand() * 256)
  }))
}

/**
 * 构造 1×256 灰度渐变条：第 i 个像素 R=G=B=i，
 * 每个灰度级恰好出现一次
 * @returns {{data: Uint8ClampedArray, width: number, height: number}}
 */
export function createGrayRampImageData() {
  return createMockImageData(256, 1, (x) => ({ r: x, g: x, b: x }))
}

// 预定义常用小尺寸场景
export const BLACK_2x2 = createSolidImageData(2, 2, 0, 0, 0)
export const WHITE_2x2 = createSolidImageData(2, 2, 255, 255, 255)
export const RED_2x2 = createSolidImageData(2, 2, 255, 0, 0)
export const GREEN_2x2 = createSolidImageData(2, 2, 0, 255, 0)
export const BLUE_2x2 = createSolidImageData(2, 2, 0, 0, 255)
