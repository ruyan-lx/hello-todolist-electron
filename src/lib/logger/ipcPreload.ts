// 文件：/src/lib/logger/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_Logger, type RendererLogPayload } from "./type";

/**
 * logger 模块渲染进程 API（由 preload 聚合暴露为 window.api.logger）
 */
export const loggerApi = {
  /** 发送日志到主进程落盘 */
  log: (payload: RendererLogPayload): void => {
    ipcRenderer.send(E_IpcEvent_Logger.FromRenderer, payload);
  },

  /** 打开日志文件所在目录 */
  openFolder: (): Promise<void> => {
    return ipcRenderer.invoke(E_IpcEvent_Logger.OpenFolder);
  },
};

export type LoggerApi = typeof loggerApi;
