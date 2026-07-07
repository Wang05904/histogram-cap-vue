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

        <ImageUploader
            :image-url="imageUrl"
            @image-selected="handleImageSelected"
        />

        <ControlPanel
            v-model:algorithm="algorithm"
            :loading="loading"
            @start="startAnalysis"
        />

      </div>

      <!-- 右侧 -->
      <div class="right-panel">

        <HistogramCanvas
            :histogram="histogram"
        />

        <ResultPanel
            :cost-time="costTime"
            :pixel-count="pixelCount"
            :peak-gray="peakGray"
            :peak-count="peakCount"
            :image-width="imageWidth"
            :image-height="imageHeight"
        />

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

  try {

    /**
     * 下一章节开始真正计算
     */

    await new Promise(resolve => setTimeout(resolve, 800))

    costTime.value = 18.25

    imageWidth.value = 1920

    imageHeight.value = 1080

    pixelCount.value = imageWidth.value * imageHeight.value

    peakGray.value = 182

    peakCount.value = 17837

  } finally {

    loading.value = false

  }

}
</script>

<style scoped>

.home-page{

  width:100%;

  padding:25px;

}

.title-card{

  margin-bottom:20px;

  text-align:center;

}

.title-card h1{

  font-size:34px;

  color:#409EFF;

}

.title-card p{

  margin-top:10px;

  color:#909399;

}

.content{

  display:grid;

  grid-template-columns:420px 1fr;

  gap:20px;

}

.left-panel{

  display:flex;

  flex-direction:column;

  gap:20px;

}

.right-panel{

  display:flex;

  flex-direction:column;

  gap:20px;

}

@media (max-width:1000px){

  .content{

    grid-template-columns:1fr;

  }

}

</style>