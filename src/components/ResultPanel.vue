<template>
  <el-card class="result-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>统计结果</span>
      </div>
    </template>

    <el-descriptions
        :column="1"
        border
    >

      <el-descriptions-item label="统计耗时">
        <span class="value time">
          {{ costTime.toFixed(2) }} ms
        </span>
      </el-descriptions-item>

      <el-descriptions-item label="图片尺寸">
        <span class="value">
          {{ imageSize }}
        </span>
      </el-descriptions-item>

      <el-descriptions-item label="总像素">
        <span class="value">
          {{ pixelCount.toLocaleString() }}
        </span>
      </el-descriptions-item>

      <el-descriptions-item label="峰值灰度">
        <span class="value">
          {{ peakGray }}
        </span>
      </el-descriptions-item>

      <el-descriptions-item label="峰值数量">
        <span class="value">
          {{ peakCount.toLocaleString() }}
        </span>
      </el-descriptions-item>

    </el-descriptions>

    <el-divider />

    <div class="tip">

      <el-alert
          title="说明"
          type="success"
          :closable="false"
          show-icon
      >
        <template #default>

          <div class="tip-content">

            统计结果依据灰度公式：

            <br>

            Gray = R × 0.299 + G × 0.587 + B × 0.114

            <br><br>

            直方图高度已归一化到 0~100。

          </div>

        </template>

      </el-alert>

    </div>

  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {

  costTime:number

  pixelCount:number

  peakGray:number

  peakCount:number

  imageWidth:number

  imageHeight:number

}

const props=defineProps<Props>()

const imageSize=computed(()=>{

  if(props.imageWidth===0){

    return "--"

  }

  return `${props.imageWidth} × ${props.imageHeight}`

})
</script>

<style scoped>

.result-card{

  width:100%;

}

.card-header{

  font-size:18px;

  font-weight:600;

}

.value{

  font-weight:600;

  color:#303133;

}

.time{

  color:#409EFF;

  font-size:18px;

}

.tip{

  margin-top:10px;

}

.tip-content{

  line-height:1.8;

  font-size:14px;

}

</style>