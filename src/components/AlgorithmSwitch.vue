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
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
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
  line-height: 1.4;
}

.algorithm-select {
  width: 100%;
}
</style>
