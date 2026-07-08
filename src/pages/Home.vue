<template>
  <div class="page">
    <AppHeader />

    <main class="layout">
      <section class="left-column">
        <ImageUploader
          :image-url="store.imageUrl"
          @image-selected="handleImageSelected"
          @image-removed="handleImageRemoved"
        />
      </section>

      <section class="right-column">
        <ImagePreview
          :image-url="store.imageUrl"
          :image-name="store.imageName"
          :image-width="store.imageWidth"
          :image-height="store.imageHeight"
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
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import AlgorithmSwitch from '@/components/AlgorithmSwitch.vue'
import AppHeader from '@/components/AppHeader.vue'
import ImagePreview from '@/components/ImagePreview.vue'
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
  padding: 24px;
  background: #f3f4f6;
}

.layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.95fr) minmax(360px, 1.05fr);
  gap: 24px;
  align-items: start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.actions .el-button {
  min-width: 220px;
}

@media (max-width: 900px) {
  .page {
    padding: 16px;
  }

  .layout {
    grid-template-columns: 1fr;
  }

  .actions .el-button {
    width: 100%;
  }
}
</style>
