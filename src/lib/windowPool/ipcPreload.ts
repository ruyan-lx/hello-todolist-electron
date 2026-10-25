// 文件：/src/lib/windowPool/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_WindowPool, type DemoWindowResult, type WindowPoolStats } from "./type";

/**
 * windowPool 模块渲染进程 API（由 preload 聚合暴露为 window.api.windowPool）
 */
export const windowPoolApi = {
  /** 打开演示窗口 */
  openDemo: (): Promise<DemoWindowResult> => {
    return ipcRenderer.invoke(E_IpcEvent_WindowPool.OpenDemo);
  },

  /** 查询窗口池统计 */
  getStats: (): Promise<WindowPoolStats> => {
    return ipcRenderer.invoke(E_IpcEvent_WindowPool.Stats);
  },

  /** 销毁全部池内窗口 */
  destroyAll: (): Promise<WindowPoolStats> => {
    return ipcRenderer.invoke(E_IpcEvent_WindowPool.DestroyAll);
  },
};

export type WindowPoolApi = typeof windowPoolApi;
