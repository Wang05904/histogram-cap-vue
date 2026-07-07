<template>
  <el-card class="histogram-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">256 x 100 黑白直方图</div>
          <div class="sub-title">使用算法返回的 ImageData 绘制</div>
        </div>
        <el-tag round effect="plain" type="primary">256 个灰度桶</el-tag>
      </div>
    </template>

    <div class="canvas-shell">
      <canvas ref="canvasRef" width="256" height="100"></canvas>
    </div>
  </el-card>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  normalizedBins: {
    type: Array,
    default: () => []
  },
  histogramImageData: {
    type: [Object, null],
    default: null
  }
})

const emit = defineEmits(['rendered'])
const canvasRef = ref()

function buildImageData() {
  const width = 256
  const height = 100
  const pixels = new Uint8ClampedArray(width * height * 4)

  for (let x = 0; x < width; x++) {
    const barHeight = Math.max(0, Math.min(100, props.normalizedBins[x] || 0))

    for (let y = 0; y < height; y++) {
      const offset = (y * width + x) * 4
      const value = y >= height - barHeight ? 0 : 255

      pixels[offset] = value
      pixels[offset + 1] = value
      pixels[offset + 2] = value
      pixels[offset + 3] = 255
    }
  }

  return new ImageData(pixels, width, height)
}

function draw() {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const start = performance.now()
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.imageSmoothingEnabled = false
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, 256, 100)

  const imageData = props.histogramImageData || buildImageData()
  context.putImageData(imageData, 0, 0)

  emit('rendered', Number((performance.now() - start).toFixed(3)))
}

watch(
  () => [props.histogramImageData, props.normalizedBins],
  async () => {
    await nextTick()
    draw()
  },
  { deep: true }
)

onMounted(draw)
</script>

<style scoped>
.histogram-card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}

.sub-title {
  margin-top: 4px;
  color: #6b7280;
  font-size: 13px;
}

.canvas-shell {
  width: 100%;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
  min-height: 220px;
  image-rendering: pixelated;
}
</style>
