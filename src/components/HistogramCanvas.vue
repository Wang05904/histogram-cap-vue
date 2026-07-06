<template>
    <canvas ref="histCanvas" width="256" height="100"></canvas>
  </template>
  <script setup>
  import { ref, watch, onMounted } from 'vue'
  const histCanvas = ref(null)
  
  // 接收父组件传入归一化后的直方图数据
  const props = defineProps(['histData'])
  
  const drawHist = (data) => {
    const canvas = histCanvas.value
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 256, 100)
    ctx.fillStyle = '#000'
    for (let x = 0; x < 256; x++) {
      const h = data[x]
      const y = 100 - h
      ctx.fillRect(x, y, 1, h)
    }
  }
  
  watch(() => props.histData, (val) => {
    if (val && val.length === 256) drawHist(val)
  }, { immediate: true })
  </script>
  <style scoped>
  canvas {
    border: 1px solid #ccc;
    width: 100%;
    max-width: 256px;
  }
  </style>