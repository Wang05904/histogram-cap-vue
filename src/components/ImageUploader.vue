<template>
  <el-card shadow="never" class="uploader-card">

    <template #header>
      <div class="card-header">
        <div>
          <div class="title">上传图片</div>
          <div class="sub-title">
            Upload Image
          </div>
        </div>

        <el-tag round effect="plain">
          Image
        </el-tag>
      </div>
    </template>

    <div
        class="upload-area"
        @click="selectImage"
        @dragover.prevent
        @drop.prevent="onDrop"
    >

      <!-- 未上传 -->
      <template v-if="!previewUrl">

        <div class="upload-icon">
          <el-icon :size="50">
            <Plus />
          </el-icon>
        </div>

        <h3>点击或拖拽上传图片</h3>

        <p>
          支持 JPG、PNG、JPEG、BMP、WEBP
        </p>

      </template>

      <!-- 已上传 -->
      <template v-else>

        <img
            class="preview"
            :src="previewUrl"
            alt=""
        />

      </template>

    </div>

    <div
        v-if="previewUrl"
        class="buttons"
    >

      <el-button
          type="primary"
          round
          @click="selectImage"
      >
        更换图片
      </el-button>

      <el-button
          round
          @click="removeImage"
      >
        删除图片
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

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue"
import { Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

interface ImagePayload {

  url: string

  file: File

}

const emit = defineEmits<{

  (e: "image-selected", payload: ImagePayload): void

}>()

const inputRef = ref<HTMLInputElement>()

const previewUrl = ref("")

let currentFile: File | null = null

function selectImage() {

  inputRef.value?.click()

}

function onSelect(event: Event) {

  const target = event.target as HTMLInputElement

  if (!target.files?.length) return

  loadFile(target.files[0])

}

function onDrop(event: DragEvent) {

  if (!event.dataTransfer?.files.length) return

  loadFile(event.dataTransfer.files[0])

}

function loadFile(file: File) {

  if (!file.type.startsWith("image")) {

    ElMessage.error("请选择图片")

    return

  }

  if (previewUrl.value) {

    URL.revokeObjectURL(previewUrl.value)

  }

  previewUrl.value = URL.createObjectURL(file)

  currentFile = file

  emit("image-selected", {

    url: previewUrl.value,

    file

  })

}

function removeImage() {

  if (previewUrl.value) {

    URL.revokeObjectURL(previewUrl.value)

  }

  previewUrl.value = ""

  currentFile = null

  if (inputRef.value) {

    inputRef.value.value = ""

  }

}

onBeforeUnmount(() => {

  if (previewUrl.value) {

    URL.revokeObjectURL(previewUrl.value)

  }

})
</script>

<style scoped>

.uploader-card {

  border-radius: 22px;

  border: none;

  box-shadow: 0 10px 30px rgba(0,0,0,.06);

}

.card-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

}

.title {

  font-size: 18px;

  font-weight: 600;

}

.sub-title {

  margin-top: 4px;

  color: #909399;

  font-size: 13px;

}

.upload-area {

  height: 340px;

  border: 2px dashed #409EFF;

  border-radius: 18px;

  background: #fafcff;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  transition: .25s;

  cursor: pointer;

  overflow: hidden;

}

.upload-area:hover {

  border-color: #66b1ff;

  background: #ecf5ff;

}

.upload-icon {

  width: 90px;

  height: 90px;

  border-radius: 50%;

  background: #409EFF;

  color: white;

  display: flex;

  justify-content: center;

  align-items: center;

  margin-bottom: 20px;

}

h3 {

  margin: 0;

  font-size: 20px;

  font-weight: 600;

  color: #303133;

}

p {

  margin-top: 12px;

  color: #909399;

}

.preview {

  width: 100%;

  height: 100%;

  object-fit: contain;

  padding: 12px;

}

.buttons {

  display: flex;

  justify-content: center;

  gap: 18px;

  margin-top: 20px;

}

</style>