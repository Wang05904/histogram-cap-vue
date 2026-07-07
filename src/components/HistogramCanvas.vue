<template>
  <el-card class="histogram-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <div class="header-icon">
            📊
          </div>
          <div>
            <div class="title">灰度直方图</div>
            <div class="subtitle">
              Histogram Analysis
            </div>
          </div>
        </div>

        <el-tag round effect="plain" type="primary">
          256 Bins
        </el-tag>
      </div>
    </template>

    <div ref="wrapperRef" class="canvas-wrapper">
      <canvas ref="canvasRef"></canvas>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface Props {
  histogram: number[]
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

let resizeObserver: ResizeObserver | null = null

const CANVAS_HEIGHT = 320

function draw() {

  const canvas = canvasRef.value
  const wrapper = wrapperRef.value

  if (!canvas || !wrapper) return

  const width = wrapper.clientWidth
  const height = CANVAS_HEIGHT

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")

  if (!ctx) return

  //--------------------------------
  // 背景
  //--------------------------------

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = "#fafafa"
  ctx.fillRect(0, 0, width, height)

  //--------------------------------
  // 网格
  //--------------------------------

  ctx.strokeStyle = "#ececec"
  ctx.lineWidth = 1

  for (let i = 0; i <= 10; i++) {

    const y = i * height / 10

    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()

  }

  //--------------------------------
  // 坐标轴
  //--------------------------------

  ctx.strokeStyle = "#666"
  ctx.lineWidth = 2

  ctx.beginPath()

  ctx.moveTo(40, 10)
  ctx.lineTo(40, height - 30)
  ctx.lineTo(width - 10, height - 30)

  ctx.stroke()

  //--------------------------------
  // 柱状图
  //--------------------------------

  const left = 40
  const bottom = height - 30
  const chartWidth = width - left - 10
  const chartHeight = height - 40

  const barWidth = chartWidth / 256

  const gradient = ctx.createLinearGradient(
      0,
      bottom,
      0,
      0
  )

  gradient.addColorStop(0, "#79bbff")
  gradient.addColorStop(1, "#409EFF")

  ctx.fillStyle = gradient

  for (let i = 0; i < 256; i++) {

    const value = props.histogram[i] ?? 0

    const barHeight = value / 100 * chartHeight

    ctx.fillRect(
        left + i * barWidth,
        bottom - barHeight,
        Math.max(barWidth, 1),
        barHeight
    )

  }

  //--------------------------------
  // X轴
  //--------------------------------

  ctx.fillStyle = "#888"
  ctx.font = "12px Arial"

  for (let i = 0; i <= 8; i++) {

    const value = i * 32

    const x = left + value * barWidth

    ctx.fillText(
        String(value),
        x - 8,
        height - 8
    )

  }

  //--------------------------------
  // Y轴
  //--------------------------------

  for (let i = 0; i <= 5; i++) {

    const value = 100 - i * 20

    const y = 10 + i * chartHeight / 5

    ctx.fillText(
        String(value),
        5,
        y + 5
    )

  }

}

watch(
    () => props.histogram,
    async () => {

      await nextTick()

      draw()

    },
    {
      deep: true
    }
)

onMounted(() => {

  draw()

  resizeObserver = new ResizeObserver(() => {

    draw()

  })

  if (wrapperRef.value) {

    resizeObserver.observe(wrapperRef.value)

  }

})

onBeforeUnmount(() => {

  resizeObserver?.disconnect()

})
</script>

<style scoped>

.histogram-card {

  width: 100%;

  border: none;

  border-radius: 20px;

  overflow: hidden;

  box-shadow: 0 10px 30px rgba(0,0,0,.06);

}

.card-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

}

.header-left {

  display: flex;

  align-items: center;

  gap: 14px;

}

.header-icon {

  width: 46px;

  height: 46px;

  border-radius: 14px;

  background: linear-gradient(135deg,#409EFF,#66b1ff);

  color: white;

  display: flex;

  justify-content: center;

  align-items: center;

  font-size: 22px;

}

.title {

  font-size: 18px;

  font-weight: 600;

  color: #303133;

}

.subtitle {

  margin-top: 4px;

  font-size: 13px;

  color: #909399;

}

.canvas-wrapper {

  width: 100%;

}

canvas {

  width: 100%;

  height: 320px;

  display: block;

  border-radius: 14px;

  background: #fafafa;

}

</style>