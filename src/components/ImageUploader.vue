<template>
  <el-card shadow="never" class="uploader-card">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">上传图片</div>
          <div class="sub-title">支持 JPG、PNG、BMP、WEBP</div>
        </div>
        <el-tag v-if="imageUrl" round effect="plain">
          {{ imageWidth }} x {{ imageHeight }}
        </el-tag>
        <el-tag v-else round effect="plain">输入</el-tag>
      </div>
    </template>

    <!-- Upload area (shown when no image) -->
    <div
      v-if="!imageUrl"
      class="upload-area"
      @click="selectImage"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <div class="upload-icon">
        <el-icon :size="42"><Plus /></el-icon>
      </div>
      <h3>点击或拖拽图片到这里</h3>
      <p>所有计算均在本地完成</p>
    </div>

    <!-- Canvas area (shown when image loaded) -->
    <div
      v-else
      ref="canvasContainer"
      class="canvas-container"
      @mousedown.prevent="onMouseDown"
      @mousemove.prevent="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
      @touchstart.prevent="onTouchStart"
      @touchmove.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <canvas
        ref="canvasRef"
        class="crop-canvas"
      />
      <canvas
        ref="overlayCanvasRef"
        class="overlay-canvas"
        :style="overlayStyle"
      />
      <div
        v-if="!hasCrop && !drawing && imageUrl"
        class="selection-hint"
      >
        <span class="hint-icon">+</span>
        <span>拖拽框选分析区域</span>
      </div>
    </div>

    <!-- Action buttons -->
    <div v-if="imageUrl" class="buttons">
      <el-button type="primary" round :icon="Refresh" @click="selectImage">
        更换
      </el-button>
      <el-button
        v-if="hasCrop"
        round
        @click="clearCrop"
      >
        清除框选
      </el-button>
      <el-button round :icon="Delete" @click.stop="removeImage">
        移除
      </el-button>
    </div>

    <input
      ref="inputRef"
      type="file"
      hidden
      accept="image/*"
      @change="onSelect"
    />
  </el-card>
</template>

<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  imageUrl: { type: String, default: '' },
  cropRect: { type: Object, default: null }
})

const emit = defineEmits(['image-selected', 'image-removed', 'crop-changed'])
const inputRef = ref(null)
const canvasRef = ref(null)
const overlayCanvasRef = ref(null)
const canvasContainer = ref(null)

// Image natural dimensions
const imageWidth = ref(0)
const imageHeight = ref(0)

// Canvas display dimensions
const canvasDisplayWidth = ref(0)
const canvasDisplayHeight = ref(0)

// Drawing state
const drawing = ref(false)
const hasCrop = ref(false)
const drawStart = ref({ x: 0, y: 0 })
const drawEnd = ref({ x: 0, y: 0 })

// Current crop rect in canvas coordinates
const canvasRect = ref({ x: 0, y: 0, w: 0, h: 0 })

// Loaded Image element reference
let loadedImg = null

// --- File selection ---

function selectImage() {
  inputRef.value?.click()
}

function onSelect(event) {
  const target = event.target
  if (!target.files?.length) return
  loadFile(target.files[0])
  target.value = ''
}

function onDrop(event) {
  if (!event.dataTransfer?.files.length) return
  loadFile(event.dataTransfer.files[0])
}

function loadFile(file) {
  if (file.type && !file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // Reset crop state
  drawing.value = false
  hasCrop.value = false
  canvasRect.value = { x: 0, y: 0, w: 0, h: 0 }
  loadedImg = null

  emit('image-selected', { url: URL.createObjectURL(file), file })
}

function removeImage() {
  drawing.value = false
  hasCrop.value = false
  canvasRect.value = { x: 0, y: 0, w: 0, h: 0 }
  loadedImg = null
  imageWidth.value = 0
  imageHeight.value = 0
  canvasDisplayWidth.value = 0
  canvasDisplayHeight.value = 0
  emit('image-removed')
}

// --- Canvas rendering ---

async function loadImageToCanvas(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

function redrawCanvas() {
  const canvas = canvasRef.value
  const container = canvasContainer.value
  if (!canvas || !container || !loadedImg) return

  const containerWidth = container.clientWidth
  const containerHeight = 300

  const scale = Math.min(
    containerWidth / loadedImg.naturalWidth,
    containerHeight / loadedImg.naturalHeight,
    1
  )
  const dw = Math.round(loadedImg.naturalWidth * scale)
  const dh = Math.round(loadedImg.naturalHeight * scale)

  canvasDisplayWidth.value = dw
  canvasDisplayHeight.value = dh
  canvas.width = dw
  canvas.height = dh
  canvas.style.width = dw + 'px'
  canvas.style.height = dh + 'px'

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, dw, dh)
  ctx.drawImage(loadedImg, 0, 0, dw, dh)

  // Sync overlay canvas
  redrawOverlay()
}

// --- Mouse events for crop rectangle ---

// --- Touch events for mobile ---

function getTouchCanvasPos(event) {
  const touch = event.touches[0] || event.changedTouches[0]
  if (!touch) return { x: 0, y: 0 }
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(touch.clientX - rect.left, canvas.width)),
    y: Math.max(0, Math.min(touch.clientY - rect.top, canvas.height))
  }
}

function onTouchStart(event) {
  if (!loadedImg || drawing.value) return
  const pos = getTouchCanvasPos(event)
  if (pos.x < 0 || pos.y < 0 || pos.x > canvasRef.value.width || pos.y > canvasRef.value.height)
    return
  drawing.value = true
  hasCrop.value = false
  drawStart.value = { x: pos.x, y: pos.y }
  drawEnd.value = { x: pos.x, y: pos.y }
}

function onTouchMove(event) {
  if (!drawing.value || !loadedImg) return
  const pos = getTouchCanvasPos(event)
  drawEnd.value = { x: pos.x, y: pos.y }
  updateCanvasRect()
  redrawOverlay()
}

function onTouchEnd() {
  onMouseUp() // reuse same finalization logic
}

function getCanvasPos(event) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(event.clientX - rect.left, canvas.width)),
    y: Math.max(0, Math.min(event.clientY - rect.top, canvas.height))
  }
}

function onMouseDown(event) {
  if (!loadedImg || drawing.value) return
  const pos = getCanvasPos(event)
  drawing.value = true
  hasCrop.value = false
  drawStart.value = { x: pos.x, y: pos.y }
  drawEnd.value = { x: pos.x, y: pos.y }
  redrawOverlay()
}

function onMouseMove(event) {
  if (!drawing.value || !loadedImg) return
  const pos = getCanvasPos(event)
  drawEnd.value = { x: pos.x, y: pos.y }
  updateCanvasRect()
  redrawOverlay()
}

function onMouseUp() {
  if (!drawing.value) return
  updateCanvasRect()

  // If the selection is too small, treat as cleared
  if (canvasRect.value.w < 8 || canvasRect.value.h < 8) {
    hasCrop.value = false
    canvasRect.value = { x: 0, y: 0, w: 0, h: 0 }
    drawing.value = false
    redrawOverlay()
    emitCropRect(null)
    return
  }

  hasCrop.value = true
  drawing.value = false
  redrawOverlay()
  emitCropRect(canvasRect.value)
}

function updateCanvasRect() {
  const sx = Math.min(drawStart.value.x, drawEnd.value.x)
  const sy = Math.min(drawStart.value.y, drawEnd.value.y)
  const ex = Math.max(drawStart.value.x, drawEnd.value.x)
  const ey = Math.max(drawStart.value.y, drawEnd.value.y)

  canvasRect.value = {
    x: sx,
    y: sy,
    w: ex - sx,
    h: ey - sy
  }
}

function clearCrop() {
  hasCrop.value = false
  drawing.value = false
  canvasRect.value = { x: 0, y: 0, w: 0, h: 0 }
  redrawOverlay()
  emitCropRect(null)
}

function emitCropRect(cRect) {
  if (!cRect || cRect.w <= 0 || cRect.h <= 0 || !loadedImg) {
    emit('crop-changed', null)
    return
  }

  // Convert canvas coordinates to original image coordinates
  const scaleX = loadedImg.naturalWidth / canvasDisplayWidth.value
  const scaleY = loadedImg.naturalHeight / canvasDisplayHeight.value

  emit('crop-changed', {
    x: Math.round(cRect.x * scaleX),
    y: Math.round(cRect.y * scaleY),
    width: Math.round(cRect.w * scaleX),
    height: Math.round(cRect.h * scaleY)
  })
}

// --- Overlay canvas drawing ---

const overlayStyle = computed(() => {
  const cw = canvasDisplayWidth.value
  const ch = canvasDisplayHeight.value
  if (cw <= 0 || ch <= 0) {
    return { display: 'none' }
  }
  return {
    width: cw + 'px',
    height: ch + 'px',
    display: 'block'
  }
})

function redrawOverlay() {
  const canvas = overlayCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const cw = canvasDisplayWidth.value
  const ch = canvasDisplayHeight.value

  if (cw <= 0 || ch <= 0) return

  canvas.width = cw
  canvas.height = ch
  ctx.clearRect(0, 0, cw, ch)

  if (!drawing.value && !hasCrop.value) return

  const r = canvasRect.value
  if (r.w <= 0 || r.h <= 0) return

  const isDrawing = drawing.value

  // Dark semi-transparent mask over entire canvas
  ctx.fillStyle = isDrawing ? 'rgba(0, 0, 0, 0.40)' : 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, 0, cw, ch)

  // Clear the selection area (the "window")
  ctx.clearRect(r.x, r.y, r.w, r.h)

  // Crosshair guide lines extending to edges (only while drawing)
  if (isDrawing) {
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 10])
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, ch)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(cw, cy)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  // Subtle warm fill inside selection
  ctx.fillStyle = 'rgba(196, 125, 90, 0.10)'
  ctx.fillRect(r.x, r.y, r.w, r.h)

  // Outer white hairline for contrast against dark mask
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1
  ctx.strokeRect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1)

  // Main accent dashed border
  const lineW = isDrawing ? 2 : 3
  ctx.strokeStyle = '#C47D5A'
  ctx.lineWidth = lineW
  ctx.setLineDash([8, 5])
  ctx.strokeRect(r.x, r.y, r.w, r.h)
  ctx.setLineDash([])

  // Corner handles (only when selection is committed and large enough)
  if (!isDrawing && r.w >= 20 && r.h >= 20) {
    drawCornerHandles(ctx, r)
  }
}

function drawCornerHandles(ctx, r) {
  const hs = 8
  const hh = hs / 2
  const radius = 2

  const corners = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x, y: r.y + r.h },
    { x: r.x + r.w, y: r.y + r.h }
  ]

  corners.forEach(c => {
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, c.x - hh, c.y - hh, hs, hs, radius)
    ctx.fill()
    ctx.strokeStyle = '#C47D5A'
    ctx.lineWidth = 2
    roundRect(ctx, c.x - hh, c.y - hh, hs, hs, radius)
    ctx.stroke()
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// --- Watch for imageUrl changes ---

watch(
  () => props.imageUrl,
  async (newUrl) => {
    if (!newUrl) {
      loadedImg = null
      imageWidth.value = 0
      imageHeight.value = 0
      hasCrop.value = false
      drawing.value = false
      canvasRect.value = { x: 0, y: 0, w: 0, h: 0 }
      redrawOverlay()
      return
    }

    try {
      loadedImg = await loadImageToCanvas(newUrl)
      imageWidth.value = loadedImg.naturalWidth
      imageHeight.value = loadedImg.naturalHeight
      await nextTick()
      redrawCanvas()
    } catch (e) {
      console.error('Failed to load image to canvas:', e)
    }
  },
  { immediate: true }
)

// Watch for cropRect changes from store (for restoring state after navigation)
watch(
  () => props.cropRect,
  (rect) => {
    if (!rect || !loadedImg || rect.width <= 0 || rect.height <= 0) return

    const scaleX = canvasDisplayWidth.value / loadedImg.naturalWidth
    const scaleY = canvasDisplayHeight.value / loadedImg.naturalHeight

    canvasRect.value = {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      w: rect.width * scaleX,
      h: rect.height * scaleY
    }
    hasCrop.value = true
    if (canvasDisplayWidth.value > 0 && canvasDisplayHeight.value > 0) {
      nextTick(() => redrawOverlay())
    }
  },
  { immediate: true }
)

// Handle window resize
let resizeObserver = null

onMounted(() => {
  if (canvasContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      if (loadedImg) redrawCanvas()
    })
    resizeObserver.observe(canvasContainer.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.uploader-card {
  background: var(--paper-card);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.upload-area {
  display: flex;
  min-height: 300px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  border: 2px dashed var(--border-paper);
  border-radius: 12px;
  background: var(--paper-input);
  transition: border-color 0.3s, background 0.3s;
}
.upload-area:hover {
  border-color: var(--accent);
  background: #FDF5ED;
}
.upload-icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--accent);
  color: white;
}
h3 {
  margin: 18px 0 6px;
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 600;
}
p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 13px;
}

/* --- Canvas crop area --- */
.canvas-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 2px solid var(--border-paper);
  border-radius: 12px;
  background: var(--paper-input);
  overflow: hidden;
  cursor: crosshair;
}

.crop-canvas {
  display: block;
  border-radius: 8px;
}

.overlay-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border-radius: 8px;
  z-index: 2;
}

.selection-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.50);
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  font-weight: 500;
  border-radius: 20px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 3;
}

.hint-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

/* --- Buttons --- */
.buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
  flex-wrap: wrap;
}

:deep(.el-button--primary) {
  background: var(--accent);
  color: white;
  border-radius: 10px;
}
:deep(.el-button--primary:hover) {
  background: var(--accent-dark);
}
:deep(.el-button--default) {
  background: var(--paper-input);
  color: var(--text-primary);
  border-radius: 10px;
}
:deep(.el-button--default:hover) {
  background: var(--paper-bg);
}
:deep(.el-tag) {
  background: var(--paper-input);
  color: var(--text-secondary);
}
</style>
