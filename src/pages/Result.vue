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
        />

        <div class="side-panel">
          <AlgorithmSwitch
            v-model="store.algorithm"
            :options="store.algorithmOptions"
          />
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
          type="primary"
          size="large"
          :loading="store.loading"
          @click="store.startAnalysis"
        >
          运行当前算法
        </el-button>

        <el-button
          size="large"
          :loading="store.benchmarkLoading"
          @click="store.runBenchmark"
        >
          对比当前图片性能
        </el-button>

        <el-button size="large" @click="goHome">
          更换图片
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
              <div class="title">性能对比</div>
              <div class="sub-title">每个算法预热一次后统计 5 次平均耗时；自动模式会使用该结果选择最快组合</div>
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
.page {
  min-height: 100vh;
  padding: 24px;
  background: #f3f4f6;
}

.top-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 24px;
  margin-bottom: 20px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin: 20px 0;
  flex-wrap: wrap;
}

.benchmark-card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

@media (max-width: 900px) {
  .page {
    padding: 16px;
  }

  .top-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions .el-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
