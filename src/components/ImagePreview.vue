<template>
  <el-card class="preview-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">原图预览</div>
          <div class="sub-title">{{ imageName || '尚未选择图片' }}</div>
        </div>
        <div class="header-right">
          <el-tag v-if="imageWidth && imageHeight" round effect="plain">
            {{ imageWidth }} x {{ imageHeight }}
          </el-tag>
          <slot name="actions"></slot>
        </div>
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
  background: var(--paper-card);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.title {
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 700;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.sub-title {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  word-break: break-all;
}
.preview-area {
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background: var(--paper-input);
}
img {
  max-width: 100%;
  max-height: 360px;
  object-fit: contain;
  border-radius: 6px;
}
:deep(.el-tag) {
  background: var(--paper-input);
  color: var(--text-secondary);
}
:deep(.el-empty__description p) {
  color: var(--text-muted);
}
</style>
