// 文件：/src/lib/system/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_System, type NotifyOptions, type TaskExecuteResult } from "./type";

/**
 * system 模块渲染进程 API（由 preload 聚合暴露为 window.api.system）
 */
export const systemApi = {
  /** 发送系统通知 */
  notify: (options: NotifyOptions): Promise<void> => {
    return ipcRenderer.invoke(E_IpcEvent_System.Notify, options);
  },

  /** 弹出信息对话框 */
  showInfoDialog: (message: string): Promise<void> => {
    return ipcRenderer.invoke(E_IpcEvent_System.DialogInfo, message);
  },

  /** 执行演示任务 */
  executeTask: (taskName: string): Promise<TaskExecuteResult> => {
    return ipcRenderer.invoke(E_IpcEvent_System.TaskExecute, taskName);
  },
};

export type SystemApi = typeof systemApi;
