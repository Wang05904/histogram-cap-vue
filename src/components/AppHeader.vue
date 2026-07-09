<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark">
        <img src="/src/assets/logo.png" alt="logo" style="width: 100%; height: 100%;" />
      </div>
      <div>
        <h1>图像直方图性能分析系统</h1>
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: nowrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@keyframes logo-pulse {
  0%, 100% {
    box-shadow: 0 1px 4px rgba(196, 125, 90, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 1px 10px rgba(196, 125, 90, 0.45), 0 0 18px rgba(196, 125, 90, 0.1);
    transform: scale(1.03);
  }
}

.brand-mark {
  display: flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--accent);
  box-shadow: 0 1px 4px rgba(196, 125, 90, 0.3);
  animation: logo-pulse 5s ease-in-out infinite;
}

.mark-text {
  color: white;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
}

h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

button {
  flex: 1;
  min-height: 42px;
  cursor: pointer;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding: 0 10px;
  transition: all 0.25s ease;
}

button:hover {
  color: var(--accent);
  border-bottom-color: var(--border-paper);
}

button.active {
  color: var(--accent);
  font-weight: 600;
  border-bottom-color: var(--accent);
}

@media (max-width: 870px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    flex-wrap: wrap;
  }

  .brand {
    gap: 8px;
  }

  h1 {
    font-size: 14px;
  }

  .tabs {
    width: 100%;
    gap: 0;
  }

  button {
    flex: 1;
    font-size: 13px;
    padding: 0 8px;
  }
}
</style>
