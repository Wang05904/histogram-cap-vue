<template>
  <el-card class="histogram-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>灰度直方图</span>
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
  /**
   * 长度固定256
   * 数据已经归一化到0~100
   */
  histogram: number[]
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement>()
const wrapperRef = ref<HTMLDivElement>()

let resizeObserver: ResizeObserver | null = null

const CANVAS_HEIGHT = 320

/**
 * 重绘
 */
function draw() {

  const canvas = canvasRef.value

  const wrapper = wrapperRef.value

  if (!canvas || !wrapper) {

    return

  }

  const width = wrapper.clientWidth

  const height = CANVAS_HEIGHT

  canvas.width = width

  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) {

    return

  }

  //--------------------------------
  // 背景
  //--------------------------------

  ctx.clearRect(0, 0, width, height)

  ctx.fillStyle = "#ffffff"

  ctx.fillRect(0, 0, width, height)

  //--------------------------------
  // 网格
  //--------------------------------

  ctx.strokeStyle = "#eeeeee"

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

  ctx.strokeStyle = "#222"

  ctx.lineWidth = 2

  ctx.beginPath()

  ctx.moveTo(35, 10)

  ctx.lineTo(35, height - 25)

  ctx.lineTo(width - 10, height - 25)

  ctx.stroke()

  //--------------------------------
  // 柱状图
  //--------------------------------

  const left = 35

  const bottom = height - 25

  const chartWidth = width - left - 10

  const chartHeight = height - 35

  const barWidth = chartWidth / 256

  ctx.fillStyle = "#000"

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
  // X轴刻度
  //--------------------------------

  ctx.fillStyle = "#666"

  ctx.font = "12px Arial"

  for (let i = 0; i <= 8; i++) {

    const value = i * 32

    const x = left + value * barWidth

    ctx.fillText(
        String(value),
        x - 8,
        height - 5
    )

  }

  //--------------------------------
  // Y轴刻度
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

.histogram-card{

  width:100%;

}

.card-header{

  font-size:18px;

  font-weight:600;

}

.canvas-wrapper{

  width:100%;

  overflow:hidden;

}

canvas{

  width:100%;

  height:320px;

  display:block;

  border-radius:8px;

  border:1px solid #e5e5e5;

}

</style>