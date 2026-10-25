// 文件：/src/renderer/api/system.ts
// system 域渲染层 API：封装 window.api.system，浏览器环境安全降级

import type { NotifyOptions, TaskExecuteResult } from "@/lib/system/type";

const hasApi = () => typeof window !== "undefined" && Boolean(window.api);

export const systemApi = {
  /** 发送系统通知 */
  notify: async (options: NotifyOptions): Promise<void> => {
    if (hasApi()) await window.api.system.notify(options);
  },

  /** 弹出信息对话框 */
  showInfoDialog: async (message: string): Promise<void> => {
    if (hasApi()) await window.api.system.showInfoDialog(message);
  },

  /** 执行演示任务 */
  executeTask: async (taskName: string): Promise<TaskExecuteResult | null> => {
    if (!hasApi()) return null;
    return window.api.system.executeTask(taskName);
  },
};
