<template>
  <div class="page">
    <AppHeader />

    <main class="layout">
      <ImageUploader
        :image-url="store.imageUrl"
        :crop-rect="store.cropRect"
        @image-selected="handleImageSelected"
        @image-removed="handleImageRemoved"
        @crop-changed="handleCropChanged"
      />

      <AlgorithmSwitch
        v-model="store.algorithm"
        :options="store.algorithmOptions"
      />

      <div class="actions">
        <el-button
          type="primary"
          size="large"
          :loading="store.loading"
          @click="handleStart"
        >
          生成直方图
        </el-button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import AlgorithmSwitch from '@/components/AlgorithmSwitch.vue'
import AppHeader from '@/components/AppHeader.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { useHistogramStore } from '@/stores/histogram'

const router = useRouter()
const store = useHistogramStore()

function handleImageSelected(payload) {
  store.setImage(payload)
}

function handleImageRemoved() {
  store.removeImage()
}

function handleCropChanged(rect) {
  store.setCropRect(rect)
}

async function handleStart() {
  const success = await store.startAnalysis()
  if (success) {
    router.push('/result')
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  max-width: 780px;
  margin: 0 auto;
}

.layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions {
  display: flex;
  justify-content: center;
}

.actions .el-button {
  min-width: 220px;
  border-radius: 10px;
}

@media (max-width: 600px) {
  .actions .el-button {
    width: 100%;
  }
}
</style>
