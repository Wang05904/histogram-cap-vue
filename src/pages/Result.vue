<template>
  <div class="result-page">

    <!-- 顶部导航 -->
    <AppHeader/>

    <!-- 如果没有统计 -->
    <el-empty
        v-if="store.pixelCount===0"
        description="暂无统计结果，请先返回首页分析图片。"
    >
      <el-button
          type="primary"
          @click="goHome"
      >
        返回首页
      </el-button>
    </el-empty>

    <!-- 有统计结果 -->
    <template v-else>

      <HistogramCanvas
          :histogram="store.histogram"
      />

      <ResultPanel
          :cost-time="store.costTime"
          :pixel-count="store.pixelCount"
          :peak-gray="store.peakGray"
          :peak-count="store.peakCount"
          :image-width="store.imageWidth"
          :image-height="store.imageHeight"
      />

      <!-- 底部按钮 -->
      <div class="actions">

        <el-button
            size="large"
            @click="goHome"
        >
          重新分析
        </el-button>

        <el-button
            type="primary"
            size="large"
            @click="goAbout"
        >
          算法说明
        </el-button>

      </div>

    </template>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import HistogramCanvas from '@/components/HistogramCanvas.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import AppHeader from '@/components/AppHeader.vue'

import { useHistogramStore } from '@/stores/histogram'

const router = useRouter()

const store = useHistogramStore()

function goHome(){

  router.push('/home')

}

function goAbout(){

  router.push('/about')

}
</script>

<style scoped>

.result-page{

  min-height:100vh;

  background:#f5f7fa;

  padding:24px;

}

.top-bar{

  display:flex;

  align-items:center;

  gap:18px;

  margin-bottom:24px;

}

.title h2{

  margin:0;

  color:#303133;

}

.title p{

  margin-top:6px;

  color:#909399;

}

.actions{

  margin-top:24px;

  display:flex;

  flex-direction:column;

  align-items:stretch;

  gap:14px;

}

.actions .el-button{

  width:100%;

  margin:0 !important;

}

@media(max-width:768px){

  .result-page{

    padding:16px;

  }

  .actions{

    margin-top:24px;

    display:flex;

    flex-direction:column;

    gap:14px;

  }

  .actions .el-button{

    width:100%;

  }

}

</style>