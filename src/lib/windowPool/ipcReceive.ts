// 文件：/src/lib/windowPool/ipcReceive.ts

import { ipcMain } from "electron";
import { WindowManager } from "./WindowManager";
import { E_IpcEvent_WindowPool, type WindowPoolStats } from "./type";

/** 空统计兜底值（窗口管理器尚未初始化时返回） */
const EMPTY_STATS: WindowPoolStats = {
  maxSize: 0,
  total: 0,
  idle: 0,
  loading: 0,
  active: 0,
};

/**
 * 注册 windowPool 模块主进程 IPC 处理器
 * @param getWindowManager 主进程入口注入的窗口管理器获取函数
 */
export function registerWindowPoolIpc(getWindowManager: () => WindowManager | null): void {
  // 打开演示窗口（连续打开超过容量即可观察 LRU 复用）
  ipcMain.handle(E_IpcEvent_WindowPool.OpenDemo, async () => {
    const windowManager = getWindowManager();
    if (!windowManager) {
      throw new Error("窗口管理器尚未初始化");
    }
    return windowManager.openDemoWindow();
  });

  // 查询窗口池统计
  ipcMain.handle(E_IpcEvent_WindowPool.Stats, () => {
    return getWindowManager()?.getStats() ?? EMPTY_STATS;
  });

  // 销毁全部池内窗口
  ipcMain.handle(E_IpcEvent_WindowPool.DestroyAll, () => {
    return getWindowManager()?.destroyAll();
  });
}
