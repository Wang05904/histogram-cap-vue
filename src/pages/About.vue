<template>
  <div class="about-page">

    <!-- 顶部 -->
    <AppHeader/>

    <!-- 灰度公式 -->
    <el-card class="card" shadow="hover">

      <template #header>

        <span>📖 灰度计算公式</span>

      </template>

      <div class="formula">

        Gray = R × 0.299 + G × 0.587 + B × 0.114

      </div>

      <p class="description">

        根据 RGB 三个颜色通道按加权平均计算灰度值，其中绿色对亮度贡献最大，
        蓝色贡献最小，因此采用加权方式能够更符合人眼视觉感知。

      </p>

    </el-card>

    <!-- 算法比较 -->
    <el-card class="card" shadow="hover">

      <template #header>

        <span>⚙ 两种统计方式</span>

      </template>

      <el-table
          :data="algorithmTable"
          border
          stripe
      >

        <el-table-column
            prop="name"
            label="算法"
        />

        <el-table-column
            prop="feature"
            label="特点"
        />

      </el-table>

    </el-card>

    <!-- 复杂度 -->
    <el-card class="card" shadow="hover">

      <template #header>

        <span>📊 时间复杂度</span>

      </template>

      <el-descriptions
          :column="1"
          border
      >

        <el-descriptions-item label="时间复杂度">

          O(n)

        </el-descriptions-item>

        <el-descriptions-item label="空间复杂度">

          O(256)

        </el-descriptions-item>

        <el-descriptions-item label="统计方式">

          单次遍历所有像素

        </el-descriptions-item>

      </el-descriptions>

    </el-card>

    <!-- 流程 -->
    <el-card class="card" shadow="hover">

      <template #header>

        <span>🔄 算法流程</span>

      </template>

      <div class="flow">

        <div class="step">

          上传图片

        </div>

        <div class="arrow">

          ↓

        </div>

        <div class="step">

          读取 RGB

        </div>

        <div class="arrow">

          ↓

        </div>

        <div class="step">

          计算灰度值

        </div>

        <div class="arrow">

          ↓

        </div>

        <div class="step">

          更新 Histogram

        </div>

        <div class="arrow">

          ↓

        </div>

        <div class="step">

          输出统计结果

        </div>

      </div>

    </el-card>

    <!-- 项目信息 -->
    <el-card class="card" shadow="hover">

      <template #header>

        <span>ℹ 项目信息</span>

      </template>

      <el-descriptions
          :column="1"
          border
      >

        <el-descriptions-item label="项目">

          图像直方图计算系统

        </el-descriptions-item>

        <el-descriptions-item label="前端">

          Vue 3 + Vite + Element Plus

        </el-descriptions-item>

        <el-descriptions-item label="统计">

          Canvas + JavaScript

        </el-descriptions-item>

      </el-descriptions>

    </el-card>

  </div>
</template>

<script setup>

import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const router = useRouter()

const algorithmTable = [

  {

    name: '优先灰度化',

    feature: '先转换为灰度图，再统计直方图，实现简单。'

  },

  {

    name: '统计时灰度化',

    feature: '边读取 RGB 边统计灰度值，只遍历一次，效率更高。'

  }

]

</script>

<style scoped>

.about-page{

  min-height:100vh;

  background:#f5f7fa;

  padding:24px;

}



.card{

  margin-bottom:20px;

  border-radius:18px;

}

.formula{

  text-align:center;

  font-size:24px;

  font-weight:700;

  color:#409EFF;

  margin:20px 0;

}

.description{

  color:#606266;

  line-height:1.8;

}

.flow{

  display:flex;

  flex-direction:column;

  align-items:center;

}

.step{

  width:220px;

  padding:14px;

  text-align:center;

  background:#ecf5ff;

  border-radius:12px;

  font-weight:600;

}

.arrow{

  font-size:24px;

  margin:8px 0;

  color:#409EFF;

}

@media(max-width:768px){

  .about-page{

    padding:16px;

  }

  .formula{

    font-size:18px;

  }

  .step{

    width:100%;

  }

}

</style>