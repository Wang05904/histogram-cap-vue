<template>
  <el-card class="preview-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">原图预览</div>
          <div class="sub-title">{{ imageName || '尚未选择图片' }}</div>
        </div>
        <el-tag v-if="imageWidth && imageHeight" round effect="plain">
          {{ imageWidth }} x {{ imageHeight }}
        </el-tag>
      </div>
    </template>

    <div class="preview-area">
      <img v-if="imageUrl" :src="imageUrl" alt="原图预览" />
      <el-empty v-else description="上传图片后显示预览" />
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  imageUrl: {
    type: String,
    default: ''
  },
  imageName: {
    type: String,
    default: ''
  },
  imageWidth: {
    type: Number,
    default: 0
  },
  imageHeight: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.preview-card {
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  word-break: break-all;
}

.preview-area {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f9fafb;
}

img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
}
</style>
