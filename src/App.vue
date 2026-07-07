<template>
  <div class="home-page">
    <!-- 页面标题 -->
    <el-card class="title-card" shadow="never">
      <h1>图像直方图计算及性能优化</h1>
      <p>Histogram Performance Analyzer</p>
    </el-card>

    <!-- 主体内容 -->
    <div class="content">

      <!-- 左侧 -->
      <div class="left-panel">

        <ImageUploader :image-url="imageUrl" @image-selected="handleImageSelected" />

        <ControlPanel v-model:algorithm="algorithm" :loading="loading" @start="startAnalysis" />

      </div>

      <!-- 右侧 -->
      <div class="right-panel">

        <HistogramCanvas :histogram="histogram" />

        <ResultPanel :cost-time="costTime" :pixel-count="pixelCount" :peak-gray="peakGray" :peak-count="peakCount"
          :image-width="imageWidth" :image-height="imageHeight" />

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import ImageUploader from '@/components/ImageUploader.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import HistogramCanvas from '@/components/HistogramCanvas.vue'
import ResultPanel from '@/components/ResultPanel.vue'

import { normalizeHistogram, computeHistogram, getHistogramStats } from '@/utils/normalize'

/**
 * 当前图片
 */
const imageUrl = ref('')
const imageFile = ref<File | null>(null)
const imageWidth = ref(0)
const imageHeight = ref(0)

/**
 * 当前算法
 *
 * pre
 * 先灰度化
 *
 * realtime
 * 统计时灰度化
 */
const algorithm = ref<'pre' | 'realtime'>('realtime')

/**
 * 是否正在统计
 */
const loading = ref(false)

/**
 * 统计耗时(ms)
 */
const costTime = ref(0)

/**
 * 总像素数
 */
const pixelCount = ref(0)

/**
 * 峰值灰度
 */
const peakGray = ref(0)

/**
 * 峰值数量
 */
const peakCount = ref(0)

/**
 * 256个灰度值
 */
const histogram = ref<number[]>(new Array(256).fill(0))

/**
 * 图片上传成功
 */
interface ImagePayload {
  url: string
  file: File
}

function handleImageSelected(payload: ImagePayload) {
  imageUrl.value = payload.url
  imageFile.value = payload.file

  histogram.value = new Array(256).fill(0)
  costTime.value = 0
  pixelCount.value = 0
  peakGray.value = 0
  peakCount.value = 0
}
/**
 * 开始统计
 *
 * 下一步将在这里调用：
 *
 * histogram.ts
 *
 * worker.ts
 */
async function startAnalysis() {
  if (!imageUrl.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  loading.value = true
  const startTime = performance.now()

  try {
    // 1. 加载图片并获取图像数据
    const img = new Image()
    img.src = imageUrl.value

    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
    })

    // 2. 创建canvas获取像素数据
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取Canvas上下文')

    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, img.width, img.height)

    // 3. 计算原始直方图
    const rawHistogram = computeHistogram(imageData, algorithm.value)

    // 4. 归一化到0~100
    const normalizedHistogram = normalizeHistogram(rawHistogram)

    // 5. 更新显示数据 - 关键：这里将归一化后的数据赋值给histogram
    histogram.value = normalizedHistogram

    // 6. 更新图片尺寸和像素信息
    imageWidth.value = img.width
    imageHeight.value = img.height
    pixelCount.value = img.width * img.height

    // 7. 获取统计信息（使用原始数据）
    const stats = getHistogramStats(rawHistogram)
    peakGray.value = stats.peakGray
    peakCount.value = stats.peakCount

    // 8. 计算耗时
    const endTime = performance.now()
    costTime.value = parseFloat((endTime - startTime).toFixed(2))

    ElMessage.success('直方图计算完成！')

  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error('图片分析失败，请重试')
    // 发生错误时重置数据
    histogram.value = new Array(256).fill(0)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.home-page {

  width: 100%;

  padding: 25px;

}

.title-card {

  margin-bottom: 20px;

  text-align: center;

}

.title-card h1 {

  font-size: 34px;

  color: #409EFF;

}

.title-card p {

  margin-top: 10px;

  color: #909399;

}

.content {

  display: grid;

  grid-template-columns: 420px 1fr;

  gap: 20px;

}

.left-panel {

  display: flex;

  flex-direction: column;

  gap: 20px;

}

.right-panel {

  display: flex;

  flex-direction: column;

  gap: 20px;

}

@media (max-width:1000px) {

  .content {

    grid-template-columns: 1fr;

  }

}
</style>