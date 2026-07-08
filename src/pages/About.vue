<template>
  <div class="page">
    <AppHeader />

    <section class="notes-grid">
      <el-card class="note-card" shadow="never">
        <template #header>
          <div class="card-title">精确灰度公式</div>
        </template>
        <p class="formula">gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)</p>
        <p>
          基准算法与自动最快候选均使用该加权灰度公式，所有候选都需要与基准算法的
          256 个 bin 完全一致。
        </p>
      </el-card>

      <el-card class="note-card" shadow="never">
        <template #header>
          <div class="card-title">自动最快维度</div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="灰度策略">直接公式 / 精确查表</el-descriptions-item>
          <el-descriptions-item label="遍历策略">普通循环 / 展开 4 像素</el-descriptions-item>
          <el-descriptions-item label="数据结构">histTypedArray</el-descriptions-item>
          <el-descriptions-item label="线程策略">
            主线程 / 单 Worker / 分块 Worker / 固定 2 Worker / 固定 4 Worker
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="note-card wide" shadow="never">
        <template #header>
          <div class="card-title">输出数据接口</div>
        </template>
        <ul>
          <li>原始 bins：256 个灰度频次。</li>
          <li>归一化 bins：256 个 0-100 范围内的高度值。</li>
          <li>渲染数据：可选的 256 x 100 黑白 ImageData。</li>
          <li>耗时字段：计算、归一化、数据生成、渲染和总耗时。</li>
        </ul>
      </el-card>
    </section>
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.wide {
  grid-column: 1 / -1;
}

.card-title {
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
}

p,
li {
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0;
}

li + li {
  margin-top: 6px;
}

.formula {
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--paper-input);
  color: var(--text-primary);
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  box-shadow: 0 0 0 1px var(--border-paper) inset;
}

@media (max-width: 800px) {
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
