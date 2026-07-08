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
  if (file.type && !file.type.startsWith('image')) {
    ElMessage.error('请选择图片文件')
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
.upload-area.active {
  border-style: solid;
  border-color: var(--border-paper);
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
