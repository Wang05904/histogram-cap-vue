<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark">H</div>
      <div>
        <h1>图像直方图性能分析系统</h1>
        <p>Vue 3 + Vite + Capacitor 移动端演示</p>
      </div>
    </div>

    <nav class="tabs">
      <button
        type="button"
        :class="{ active: route.path === '/home' }"
        @click="router.push('/home')"
      >
        工作台
      </button>
      <button
        type="button"
        :class="{ active: route.path === '/result' }"
        @click="router.push('/result')"
      >
        结果
      </button>
      <button
        type="button"
        :class="{ active: route.path === '/about' }"
        @click="router.push('/about')"
      >
        算法说明
      </button>
    </nav>
  </header>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
</script>

<style scoped>
.app-header {
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 18px;
  min-height: 108px;
  padding: 22px 26px;
  border-radius: 8px;
  background: #111827;
  color: white;
  text-align: left;
}

.brand-mark {
  display: flex;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #2563eb;
  font-size: 28px;
  font-weight: 800;
}

h1 {
  margin: 0;
  color: white;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0;
}

p {
  margin-top: 6px;
  color: #d1d5db;
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding: 6px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

button {
  flex: 1;
  min-height: 42px;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

button:hover {
  background: #eff6ff;
}

button.active {
  background: #2563eb;
  color: white;
}

@media (max-width: 700px) {
  .brand {
    align-items: flex-start;
    flex-direction: column;
  }

  h1 {
    font-size: 22px;
  }

  .tabs {
    flex-direction: column;
  }
}
</style>
