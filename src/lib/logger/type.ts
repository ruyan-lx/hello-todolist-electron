// 文件：/src/lib/logger/type.ts

/**
 * logger 模块 IPC 通道枚举
 */
export enum E_IpcEvent_Logger {
  /** 渲染进程主动发来的日志 */
  FromRenderer = "log:from-renderer",
  /** 请求打开日志文件所在目录 */
  OpenFolder = "log:open-folder",
}

/** 渲染进程日志载荷 */
export interface RendererLogPayload {
  level: "info" | "warn" | "error" | "debug" | "verbose";
  message: string;
  data?: unknown;
}
