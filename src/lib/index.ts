// 文件：/src/lib/index.ts

import type { WindowManager } from "./windowPool/WindowManager";
import type log from "electron-log/main";
import { registerTodoIpc } from "./todo/ipcReceive";
import { registerSystemIpc } from "./system/ipcReceive";
import { registerStoreIpc } from "./store/ipcReceive";
import { registerWindowPoolIpc } from "./windowPool/ipcReceive";
import { registerLoggerIpc } from "./logger/ipcReceive";
import { registerFeedbackIpc } from "./feedback/ipcReceive";

/**
 * IPC 统一注册中心：集中注册当前已开发模块的主进程 IPC 处理器
 * （在 app.whenReady 后由主进程入口调用一次）
 *
 * 扩展原则：新增业务域时，按「type.ts + ipcReceive.ts + ipcPreload.ts」三件套
 * 建目录，再在此处追加一行注册即可，主进程入口文件不再膨胀。
 */
export function setupAllIpcHandlers(options: {
  getWindowManager: () => WindowManager | null;
  log: typeof log;
}): void {
  registerTodoIpc();
  registerSystemIpc();
  registerStoreIpc();
  registerWindowPoolIpc(options.getWindowManager);
  registerLoggerIpc(options.log);
  registerFeedbackIpc(options.log);
}

// 注意：Preload 预加载环境严禁从本入口文件 import，避免将主进程专用依赖
// （electron-store、fs 等 Node.js 原生模块）打入 Preload。
// Preload 请直接引用各模块具体的 ./xxx/ipcPreload.ts
