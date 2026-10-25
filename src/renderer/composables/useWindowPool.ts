// 文件：/src/renderer/composables/useWindowPool.ts
// 窗口池演示逻辑复用层：状态 + 统计轮询 + 打开/销毁动作

import { onMounted, ref } from "vue";
import type { WindowPoolStats } from "@/lib/windowPool/type";
import { windowPoolApi } from "@/renderer/api";

export function useWindowPool() {
  const openingDemo = ref(false);
  const demoMessage = ref("");
  const poolStats = ref<WindowPoolStats>({
    maxSize: 3,
    total: 0,
    idle: 0,
    loading: 0,
    active: 0,
  });

  const openDemoWindow = async () => {
    openingDemo.value = true;
    try {
      const result = await windowPoolApi.openDemo();
      if (!result) return;
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
    poolStats.value = await windowPoolApi.destroyAll();
    demoMessage.value = "已关闭全部演示窗口";
  };

  // 组件挂载时获取窗口池当前统计
  onMounted(async () => {
    poolStats.value = await windowPoolApi.getStats();
  });

  return { openingDemo, demoMessage, poolStats, openDemoWindow, destroyDemoWindows };
}
