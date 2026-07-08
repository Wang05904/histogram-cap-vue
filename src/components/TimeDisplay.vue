<template>
  <el-card class="time-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">耗时统计</div>
          <div class="sub-title">当前图片与当前算法组合</div>
        </div>
        <el-tag :type="passed300ms ? 'success' : 'danger'" round>
          {{ passed300ms ? '< 300 ms' : '>= 300 ms' }}
        </el-tag>
      </div>
    </template>

    <div class="timing-grid">
      <div v-for="item in items" :key="item.label" class="metric">
        <span>{{ item.label }}</span>
        <strong>{{ formatMs(item.value) }}</strong>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timing: {
    type: Object,
    required: true
  },
  passed300ms: {
    type: Boolean,
    default: false
  }
})

const items = computed(() => [
  { label: '计算耗时', value: props.timing.computeMs },
  { label: '归一化耗时', value: props.timing.normalizeMs },
  { label: '数据生成', value: props.timing.dataGenerateMs },
  { label: '渲染耗时', value: props.timing.renderMs },
  { label: '总耗时', value: props.timing.totalMs }
])

function formatMs(value) {
  return `${Number(value || 0).toFixed(3)} ms`
}
</script>

<style scoped>
.time-card {
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
}

.timing-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.metric {
  min-width: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.metric span {
  display: block;
  color: #6b7280;
  font-size: 13px;
}

.metric strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 16px;
  word-break: break-word;
}

@media (max-width: 860px) {
  .timing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
