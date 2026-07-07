<template>
  <el-card class="panel-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>参数设置</span>
      </div>
    </template>

    <!-- 算法选择 -->
    <div class="section">
      <div class="section-title">
        直方图计算方式
      </div>

      <el-radio-group
          v-model="localAlgorithm"
          @change="onAlgorithmChange"
      >
        <el-radio value="pre">
          优先灰度化
        </el-radio>

        <el-radio value="realtime">
          统计时灰度化
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 当前算法介绍 -->
    <el-alert
        :title="algorithmTitle"
        :description="algorithmDescription"
        type="info"
        :closable="false"
        show-icon
    />

    <!-- 操作按钮 -->
    <div class="actions">

      <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="$emit('start')"
      >
        {{ loading ? '统计中...' : '开始统计' }}
      </el-button>

    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type AlgorithmType = 'pre' | 'realtime'

interface Props {
  algorithm: AlgorithmType
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:algorithm', value: AlgorithmType): void
  (e: 'start'): void
}>()

const localAlgorithm = ref<AlgorithmType>(props.algorithm)

watch(
    () => props.algorithm,
    (value) => {
      localAlgorithm.value = value
    }
)

function onAlgorithmChange(value: AlgorithmType) {
  emit('update:algorithm', value)
}

const algorithmTitle = computed(() => {
  return localAlgorithm.value === 'pre'
      ? '优先灰度化'
      : '统计时灰度化'
})

const algorithmDescription = computed(() => {
  if (localAlgorithm.value === 'pre') {
    return '先将彩色图片全部转换为灰度图，再统计灰度值。实现简单，但需要额外的灰度图缓存。'
  }

  return '读取 RGB 的同时计算灰度值并统计直方图，减少一次遍历，通常性能更好。'
})
</script>

<style scoped>

.panel-card{

  width:100%;

}

.card-header{

  font-size:18px;

  font-weight:600;

}

.section{

  margin-bottom:25px;

}

.section-title{

  margin-bottom:15px;

  font-size:15px;

  font-weight:600;

}

.actions{

  margin-top:30px;

  display:flex;

  justify-content:center;

}

.actions .el-button{

  width:100%;

}

</style>