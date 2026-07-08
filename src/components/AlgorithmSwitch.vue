<template>
  <el-card class="switch-card" shadow="never">
    <template #header>
      <div class="card-header">
        <div>
          <div class="title">算法选择</div>
          <div class="sub-title">{{ currentDescription }}</div>
        </div>
        <el-tag round effect="plain">{{ currentLabel }}</el-tag>
      </div>
    </template>

    <el-select
      :model-value="modelValue"
      class="algorithm-select"
      size="large"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <el-option
        v-for="option in options"
        :key="option.key"
        :label="option.label"
        :value="option.key"
      />
    </el-select>
    <div class="action-slot">
      <slot name="action"></slot>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue'])

const currentDescription = computed(() => {
  return props.options.find((item) => item.key === props.modelValue)?.description || ''
})

const currentLabel = computed(() => {
  return props.options.find((item) => item.key === props.modelValue)?.label || props.modelValue
})
</script>

<style scoped>
.switch-card {
  background: var(--paper-card);
}
.card-header {
  display: flex;
  align-items: flex-start;
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
  line-height: 1.4;
}
.algorithm-select {
  width: 100%;
}
.action-slot {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
:deep(.el-select .el-input__wrapper) {
  background: var(--paper-input);
  box-shadow: 0 0 0 1px var(--border-paper) inset;
  border-radius: 10px;
}
:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}
:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--accent) inset;
}
:deep(.el-select .el-input__inner) {
  color: var(--text-primary);
}
:deep(.el-tag) {
  background: var(--paper-input);
  color: var(--text-secondary);
}
</style>
