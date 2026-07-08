<template>
  <el-card class="result-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">统计结果</div>
          <div class="sub-title">{{ algorithmName || '暂无结果' }}</div>
        </div>
        <el-tag :type="accuracy.sameAsBaseline ? 'success' : 'warning'" round>
          {{ accuracy.sameAsBaseline ? '与基准一致' : '近似结果' }}
        </el-tag>
      </div>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item label="算法组合">
        {{ algorithmName || '--' }}
      </el-descriptions-item>
      <el-descriptions-item label="图片尺寸">
        {{ imageSize }}
      </el-descriptions-item>
      <el-descriptions-item label="像素数量">
        {{ pixelCount.toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="峰值灰度">
        {{ peakGray }}
      </el-descriptions-item>
      <el-descriptions-item label="峰值数量">
        {{ peakCount.toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item label="正确性">
        最大 bin 差异 {{ accuracy.maxBinDiff }}，总差异 {{ accuracy.totalDiff }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  algorithmName: {
    type: String,
    default: ''
  },
  accuracy: {
    type: Object,
    required: true
  },
  pixelCount: {
    type: Number,
    default: 0
  },
  peakGray: {
    type: Number,
    default: 0
  },
  peakCount: {
    type: Number,
    default: 0
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

const imageSize = computed(() => {
  if (!props.imageWidth || !props.imageHeight) {
    return '--'
  }

  return `${props.imageWidth} x ${props.imageHeight}`
})
</script>

<style scoped>
.result-card {
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
.sub-title {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  word-break: break-word;
}
:deep(.el-tag--success) {
  background: #F0F7EA;
  color: var(--success);
}
:deep(.el-tag--warning) {
  background: #FDF8EC;
  color: var(--warning);
}
</style>
