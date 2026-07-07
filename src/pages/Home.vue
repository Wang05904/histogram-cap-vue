<template>
  <div class="home-page">

    <!-- 顶部 -->
    <AppHeader/>

    <!-- 主体 -->
    <div class="content">

      <ImageUploader
          :image-url="store.imageUrl"
          @image-selected="handleImageSelected"
      />

      <ControlPanel
          v-model:algorithm="store.algorithm"
          :loading="store.loading"
          @start="handleStart"
      />

    </div>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import ImageUploader from '@/components/ImageUploader.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import AppHeader from '@/components/AppHeader.vue'

import { useHistogramStore } from '@/stores/histogram'

const router = useRouter()

const store = useHistogramStore()

function handleImageSelected(payload) {

  store.setImage(payload)

}

async function handleStart() {

  const success = await store.startAnalysis()

  if (success) {

    router.push('/result')

  }

}
</script>

<style scoped>

.home-page{

  min-height:100vh;

  background:#f5f7fa;

  padding:24px;

}

/* ---------------- Hero ---------------- */

.hero{

  height:190px;

  border-radius:26px;

  background:linear-gradient(
      135deg,
      #409EFF,
      #66b1ff
  );

  color:white;

  display:flex;

  flex-direction:column;

  justify-content:center;

  align-items:center;

  box-shadow:
      0 12px 28px rgba(64,158,255,.22);

}

.hero-icon{

  width:72px;

  height:72px;

  border-radius:50%;

  background:rgba(255,255,255,.18);

  display:flex;

  justify-content:center;

  align-items:center;

  font-size:34px;

  margin-bottom:16px;

}

.hero h1{

  margin:0;

  font-size:34px;

  font-weight:700;

}

.hero p{

  margin-top:10px;

  font-size:15px;

  opacity:.92;

}

/* ---------------- 内容 ---------------- */

.content{

  margin-top:24px;

  display:flex;

  flex-direction:column;

  gap:24px;

}

/* ---------------- 手机 ---------------- */

@media(max-width:768px){

  .home-page{

    padding:16px;

  }

  .hero{

    height:170px;

  }

  .hero h1{

    font-size:28px;

  }

}

</style>