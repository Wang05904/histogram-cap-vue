<template>
  <div class="page">
    <AppHeader />

    <section class="notes-grid">
      <el-card class="note-card" shadow="never">
        <template #header>
          <div class="title">精确灰度公式</div>
        </template>
        <p class="formula">gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114)</p>
        <p>
          基准算法与默认精确算法均使用该加权灰度公式，确保结果可校验。
        </p>
      </el-card>

      <el-card class="note-card" shadow="never">
        <template #header>
          <div class="title">默认演示算法</div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="灰度">floatGray</el-descriptions-item>
          <el-descriptions-item label="遍历">unrolledLoop</el-descriptions-item>
          <el-descriptions-item label="数据结构">histTypedArray</el-descriptions-item>
          <el-descriptions-item label="线程">mainThread</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="note-card wide" shadow="never">
        <template #header>
          <div class="title">输出数据接口</div>
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
  padding: 24px;
  background: #f3f4f6;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.note-card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.08);
}

.wide {
  grid-column: 1 / -1;
}

.title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}

p,
li {
  color: #4b5563;
  line-height: 1.7;
}

.formula {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  color: #111827;
  font-family: Consolas, monospace;
}

@media (max-width: 800px) {
  .page {
    padding: 16px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
