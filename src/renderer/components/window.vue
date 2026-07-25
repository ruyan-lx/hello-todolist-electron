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
import { onMounted, ref } from "vue";

const openingDemo = ref(false);
const demoMessage = ref("");
const poolStats = ref({
  maxSize: 3,
  total: 0,
  idle: 0,
  loading: 0,
  active: 0,
});

const openDemoWindow = async () => {
  openingDemo.value = true;
  try {
    const result = await window.api.invoke("window-pool:open-demo");
    poolStats.value = result.stats;
    demoMessage.value = result.reused
      ? `已复用池中窗口 #${result.id}，替换演示窗口 #${result.replacedDemo}`
      : `已创建池中窗口 #${result.id}`;
  } catch (error) {
    demoMessage.value = `打开失败：${error instanceof Error ? error.message : String(error)}`;
  } finally {
    openingDemo.value = false;
  }
};

const destroyDemoWindows = async () => {
  poolStats.value = await window.api.invoke("window-pool:destroy-all");
  demoMessage.value = "已关闭全部演示窗口";
};

// 组件挂载时从主进程获取已保存的待办事项列表
onMounted(async () => {
  poolStats.value = await window.api.invoke("window-pool:stats");
});
</script>

<style>
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

.window-pool-demo .window-pool-message {
  margin-top: 8px;
  color: var(--primary-color);
}
</style>
