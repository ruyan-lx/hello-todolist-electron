// 文件：/src/renderer/api/windowPool.ts
// windowPool 域渲染层 API：封装 window.api.windowPool，浏览器环境安全降级

import type { DemoWindowResult, WindowPoolStats } from "@/lib/windowPool/type";

const hasApi = () => typeof window !== "undefined" && Boolean(window.api);

const EMPTY_STATS: WindowPoolStats = {
  maxSize: 0,
  total: 0,
  idle: 0,
  loading: 0,
  active: 0,
};

export const windowPoolApi = {
  /** 打开演示窗口 */
  openDemo: async (): Promise<DemoWindowResult | null> => {
    if (!hasApi()) return null;
    return window.api.windowPool.openDemo();
  },

  /** 查询窗口池统计 */
  getStats: async (): Promise<WindowPoolStats> => {
    if (!hasApi()) return EMPTY_STATS;
    return window.api.windowPool.getStats();
  },

  /** 销毁全部池内窗口 */
  destroyAll: async (): Promise<WindowPoolStats> => {
    if (!hasApi()) return EMPTY_STATS;
    return window.api.windowPool.destroyAll();
  },
};
