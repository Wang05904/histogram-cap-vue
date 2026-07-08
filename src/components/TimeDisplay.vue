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
}
.timing-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.metric {
  min-width: 0;
  padding: 14px 12px;
  border-radius: 10px;
  background: var(--paper-input);
  box-shadow: 0 0 0 1px var(--border-paper) inset;
}
.metric span {
  display: block;
  color: var(--text-secondary);
  font-size: 12px;
}
.metric strong {
  display: block;
  margin-top: 6px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
}
:deep(.el-tag--success) {
  background: #F0F7EA;
  color: var(--success);
}
:deep(.el-tag--danger) {
  background: #FDF0F0;
  color: var(--danger);
}
@media (max-width: 860px) {
  .timing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
