// 文件：/src/lib/windowPool/type.ts

/**
 * windowPool 模块（窗口池演示）IPC 通道枚举
 */
export enum E_IpcEvent_WindowPool {
  OpenDemo = "window-pool:open-demo",
  Stats = "window-pool:stats",
  DestroyAll = "window-pool:destroy-all",
}

/** 窗口池统计信息 */
export interface WindowPoolStats {
  maxSize: number;
  total: number;
  idle: number;
  loading: number;
  active: number;
}

/** 打开演示窗口的结果 */
export interface DemoWindowResult {
  id: number;
  reused: boolean;
  replacedDemo?: number;
  stats: WindowPoolStats;
}
