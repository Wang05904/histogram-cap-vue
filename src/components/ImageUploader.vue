<template>
  <el-card shadow="never" class="uploader-card">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">上传图片</div>
          <div class="sub-title">支持 JPG、PNG、BMP、WEBP</div>
        </div>
        <el-tag round effect="plain">输入</el-tag>
      </div>
    </template>

    <div
      class="upload-area"
      :class="{ active: imageUrl }"
      @click="selectImage"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <template v-if="!imageUrl">
        <div class="upload-icon">
          <el-icon :size="42">
            <Plus />
          </el-icon>
        </div>
        <h3>点击或拖拽图片到这里</h3>
        <p>所有计算均在本地完成</p>
      </template>

      <template v-else>
        <img class="preview" :src="imageUrl" alt="Uploaded preview" />
      </template>
    </div>

    <div v-if="imageUrl" class="buttons">
      <el-button type="primary" round :icon="Refresh" @click="selectImage">
        更换
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
import { ref } from 'vue'
import { Delete, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatErrorMessage, validateImageFile } from '@/utils/errorHandler.js'

defineProps({
  imageUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['image-selected', 'image-removed'])
const inputRef = ref()

function selectImage() {
  inputRef.value?.click()
}

function onSelect(event) {
  const target = event.target

  if (!target.files?.length) {
    return
  }

  loadFile(target.files[0])
  target.value = ''
}

function onDrop(event) {
  if (!event.dataTransfer?.files.length) {
    return
  }

  loadFile(event.dataTransfer.files[0])
}

function loadFile(file) {
  try {
    validateImageFile(file)
  } catch (error) {
    ElMessage.error(formatErrorMessage(error))
    return
  }

  emit('image-selected', {
    url: URL.createObjectURL(file),
    file
  })
}

function removeImage() {
  emit('image-removed')
}
</script>

<style scoped>
.uploader-card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.upload-area {
  display: flex;
  min-height: 300px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  overflow: hidden;
  border: 1px dashed #9ca3af;
  border-radius: 8px;
  background: #f9fafb;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-area.active {
  border-style: solid;
}

.upload-icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2563eb;
  color: white;
}

h3 {
  margin: 18px 0 6px;
  color: #111827;
  font-size: 18px;
}

p {
  color: #6b7280;
}

.preview {
  width: 100%;
  height: 300px;
  object-fit: contain;
  padding: 12px;
}

.buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
