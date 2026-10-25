// 文件：/src/lib/logger/ipcReceive.ts

import { shell } from "electron";
import { ipcMain } from "electron";
import fs from "fs";
import type log from "electron-log/main";
import { getLogger } from "./loggerService";
import { E_IpcEvent_Logger, type RendererLogPayload } from "./type";

/**
 * 注册 logger 模块主进程 IPC 处理器
 * @param log 主进程入口初始化后的 electron-log 实例
 */
export function registerLoggerIpc(logger: typeof log): void {
  // 渲染进程主动发来的日志
  ipcMain.on(E_IpcEvent_Logger.FromRenderer, (_event, { level, message, data }: RendererLogPayload) => {
    const rendererLog = logger.scope("Renderer");
    rendererLog[level](message, data ?? "");
  });

  // 渲染进程请求打开日志文件所在目录
  ipcMain.handle(E_IpcEvent_Logger.OpenFolder, async () => {
    const logPath = logger.transports.file.getFile().path;
    getLogger("App").info("用户请求打开日志目录:", logPath);
    await shell.showItemInFolder(logPath);
  });
}
