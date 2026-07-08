<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark">
        <span class="mark-text">H</span>
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
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@keyframes breathe-glow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(196, 125, 90, 0.25);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 2px 18px rgba(196, 125, 90, 0.5), 0 0 32px rgba(196, 125, 90, 0.15);
    transform: scale(1.05);
  }
}

.brand-mark {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--accent);
  box-shadow: 0 2px 8px rgba(196, 125, 90, 0.25);
  animation: breathe-glow 4s ease-in-out infinite;
}

.mark-text {
  color: white;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

h1 {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.tabs {
  display: flex;
  gap: 4px;
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
  font-size: 14px;
  font-weight: 500;
  padding: 0 12px;
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

@media (max-width: 850px) {
  .app-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .brand {
    gap: 12px;
  }

  h1 {
    font-size: 17px;
  }

  .tabs {
    width: 100%;
    gap: 2px;
  }

  button {
    flex: 1;
  }
}
</style>
