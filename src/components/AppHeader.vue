<template>
  <div class="header">

    <!-- Logo -->

    <div class="hero">

      <div class="icon">

        📊

      </div>

      <div>

        <h1>图像直方图计算</h1>

        <p>Histogram Performance Analyzer</p>

      </div>

    </div>

    <!-- Tab -->

    <div class="tabs">

      <div
          class="tab"
          :class="{ active: route.path === '/home' }"
          @click="router.push('/home')"
      >
        首页
      </div>

      <div
          class="tab"
          :class="{ active: route.path === '/result' }"
          @click="router.push('/result')"
      >
        统计结果
      </div>

      <div
          class="tab"
          :class="{ active: route.path === '/about' }"
          @click="router.push('/about')"
      >
        算法说明
      </div>

    </div>

  </div>
</template>

<script setup>

import { useRoute, useRouter } from 'vue-router'

const router = useRouter()

const route = useRoute()

</script>

<style scoped>

.header{

  margin-bottom:24px;

}

.hero{

  height:130px;

  border-radius:24px;

  background:linear-gradient(
      135deg,
      #409EFF,
      #6fb7ff);

  color:white;

  display:flex;

  align-items:center;

  justify-content:center;

  gap:20px;

  box-shadow:
      0 10px 28px rgba(64,158,255,.25);

}

.icon{

  width:70px;

  height:70px;

  border-radius:50%;

  background:rgba(255,255,255,.18);

  display:flex;

  justify-content:center;

  align-items:center;

  font-size:34px;

}

.hero h1{

  margin:0;

  font-size:32px;

}

.hero p{

  margin-top:8px;

  opacity:.92;

}

/* ---------------------- */

.tabs{

  margin-top:20px;

  display:flex;

  background:white;

  border-radius:18px;

  padding:6px;

  box-shadow:
      0 6px 18px rgba(0,0,0,.06);

}

.tab{

  flex:1;

  text-align:center;

  padding:14px;

  border-radius:14px;

  cursor:pointer;

  transition:.25s;

  font-size:15px;

  font-weight:600;

}

.tab:hover{

  background:#ecf5ff;

}

.active{

  background:#409EFF;

  color:white;

}

@media(max-width:768px){

  .hero{

    height:110px;

  }

  .hero h1{

    font-size:24px;

  }

  .hero p{

    font-size:13px;

  }

  .icon{

    width:56px;

    height:56px;

    font-size:26px;

  }

}

</style>