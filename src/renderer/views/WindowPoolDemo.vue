<template>
  <section class="window-pool-demo">
    <h2>窗口池案例</h2>
    <p>池容量为 3。连续打开第 4 个窗口时，会复用最久未聚焦的窗口。</p>
    <div class="window-pool-actions">
      <button class="btn btn-primary" :disabled="openingDemo" @click="openDemoWindow">
        {{ openingDemo ? "打开中..." : "打开演示窗口" }}
      </button>
      <button class="btn btn-secondary" @click="destroyDemoWindows">关闭全部</button>
    </div>
    <p class="window-pool-stats">
      窗口：{{ poolStats.total }}/{{ poolStats.maxSize }}，活跃： {{ poolStats.active }}，加载中：{{
        poolStats.loading
      }}
    </p>
    <p v-if="demoMessage" class="window-pool-message">{{ demoMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { useWindowPool } from "@/renderer/composables/useWindowPool";

const { openingDemo, demoMessage, poolStats, openDemoWindow, destroyDemoWindows } = useWindowPool();
</script>

<style scoped>
.window-pool-demo {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.window-pool-demo h2 {
  margin-bottom: 8px;
  font-size: 18px;
}

.window-pool-demo > p {
  color: var(--text-secondary);
  font-size: 14px;
}

.window-pool-actions {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  color: var(--text-primary);
  background: #f0f0f0;
}

.btn-secondary:hover {
  background: #d9d9d9;
}

.window-pool-message {
  margin-top: 8px;
  color: var(--primary-color);
}
</style>
