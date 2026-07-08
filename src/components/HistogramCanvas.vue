<template>
  <el-card class="histogram-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">256 x 100 黑白直方图</div>
          <div class="sub-title">使用算法返回的 ImageData 绘制</div>
        </div>
        <div class="header-right">
          <el-tag round effect="plain" type="primary">256 个灰度桶</el-tag>
          <slot name="actions"></slot>
        </div>
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
  background: var(--paper-card);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
}
.sub-title {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.canvas-shell {
  width: 100%;
  overflow: hidden;
  border-radius: 10px;
  background: var(--paper-card);
  box-shadow: 0 0 0 1px var(--border-paper) inset;
}
canvas {
  display: block;
  width: 100%;
  height: auto;
  min-height: 220px;
  image-rendering: pixelated;
}
:deep(.el-tag--primary) {
  background: #FDF5ED;
  color: var(--accent);
}
</style>
