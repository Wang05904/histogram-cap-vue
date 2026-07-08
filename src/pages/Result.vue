<template>
  <div class="page">
    <AppHeader />

    <el-empty
      v-if="store.pixelCount === 0"
      description="暂无直方图结果"
    >
      <el-button type="primary" @click="goHome">上传图片</el-button>
    </el-empty>

    <template v-else>
      <section class="top-grid">
        <ImagePreview
          :image-url="store.imageUrl"
          :image-name="store.imageName"
          :image-width="store.imageWidth"
          :image-height="store.imageHeight"
        >
          <template #actions>
            <el-button size="small" @click="goHome" class="change-img-btn">更换图片</el-button>
          </template>
        </ImagePreview>

        <div class="side-panel">
        <AlgorithmSwitch
          v-model="store.algorithm"
          :options="store.algorithmOptions"
        >
          <template #action>
            <el-button
              type="primary"
              size="large"
              :loading="store.loading"
              @click="store.startAnalysis"
            >
              运行当前算法
            </el-button>
          </template>
        </AlgorithmSwitch>
        <el-alert
            v-if="store.algorithm === 'autoExact'"
            type="info"
            :closable="false"
            show-icon
            title="自动模式会先对当前图片运行算法对比，再用耗时最短的组合生成直方图。"
          />

          <ResultPanel
            :algorithm-name="store.algorithmName"
            :accuracy="store.accuracy"
            :pixel-count="store.pixelCount"
            :peak-gray="store.peakGray"
            :peak-count="store.peakCount"
            :image-width="store.imageWidth"
            :image-height="store.imageHeight"
          />
        </div>
      </section>

      <HistogramCanvas
        :normalized-bins="store.histogram"
        :histogram-image-data="store.histogramImageData"
        @rendered="store.setRenderTime"
      />

      <TimeDisplay
        :timing="store.timing"
        :passed300ms="store.passed300ms"
      />

      <section class="actions">
        <el-button
          size="large"
          :loading="store.benchmarkLoading"
          @click="store.runBenchmark"
        >
          对比当前图片性能
        </el-button>
      </section>

      <el-card
        v-if="store.benchmarkRows.length"
        class="benchmark-card"
        shadow="never"
      >
        <template #header>
          <div class="card-header">
            <div>
              <div class="section-title">性能对比</div>
              <div class="section-sub">每个算法预热一次后统计 5 次平均耗时；自动模式会使用该结果选择最快组合</div>
            </div>
          </div>
        </template>

        <el-table :data="store.benchmarkRows" stripe border>
          <el-table-column prop="displayName" label="算法组合" min-width="260" />
          <el-table-column prop="averageMs" label="平均耗时" width="100" />
          <el-table-column prop="computeMs" label="计算" width="100" />
          <el-table-column prop="normalizeMs" label="归一化" width="110" />
          <el-table-column prop="dataGenerateMs" label="数据生成" width="100" />
          <el-table-column prop="passed300ms" label="<300ms" width="90">
            <template #default="{ row }">
              <el-tag :type="row.passed300ms ? 'success' : 'danger'" size="small">
                {{ row.passed300ms ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sameAsBaseline" label="与基准一致" width="110">
            <template #default="{ row }">
              <el-tag :type="row.sameAsBaseline ? 'success' : 'warning'" size="small">
                {{ row.sameAsBaseline ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import AlgorithmSwitch from '@/components/AlgorithmSwitch.vue'
import AppHeader from '@/components/AppHeader.vue'
import HistogramCanvas from '@/components/HistogramCanvas.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import TimeDisplay from '@/components/TimeDisplay.vue'
import { useHistogramStore } from '@/stores/histogram'

const router = useRouter()
const store = useHistogramStore()

function goHome() {
  router.push('/home')
}
</script>

<style scoped>
@keyframes card-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page {
  min-height: 100vh;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Staggered card entrance */
.top-grid > * {
  animation: card-rise 0.5s ease-out backwards;
}

.top-grid > *:nth-child(1) {
  animation-delay: 0.05s;
}

.top-grid > *:nth-child(2) {
  animation-delay: 0.15s;
}

.actions {
  animation: card-rise 0.45s ease-out backwards;
  animation-delay: 0.35s;
}

.benchmark-card {
  animation: card-rise 0.45s ease-out backwards;
  animation-delay: 0.4s;
}

:deep(.histogram-card) {
  animation: card-rise 0.45s ease-out backwards;
  animation-delay: 0.25s;
}

:deep(.time-card) {
  animation: card-rise 0.45s ease-out backwards;
  animation-delay: 0.3s;
}

.top-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 16px 0;
}

.change-img-btn {
  font-size: 13px;
  padding: 5px 14px;
  height: auto;
}

.benchmark-card {
  box-shadow: none !important;
  background: var(--paper-card);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
}

.section-sub {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

@media (max-width: 900px) {
  .top-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions .el-button {
    width: 100%;
  }
}
</style>
