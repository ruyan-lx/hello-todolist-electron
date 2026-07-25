// 文件：/electron/preload/index.ts

import { contextBridge, ipcRenderer } from "electron";

/* 
使用 contextBridge 在渲染进程的 window 对象上暴露 api 对象
作为安全桥梁，只暴露必要的 API，不直接暴露 Node.js 能力
这是因为主进程配置了 contextIsolation: true 和 nodeIntegration: false
*/
contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, data?: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  onFocusInput: (callback: () => void) => {
    ipcRenderer.on("focus-input", callback);
  },

  /*  日志 */
  // 发送日志到主进程
  log: (level: any, message: any, data: any) => {
    ipcRenderer.send('log:from-renderer', { level, message, data });
  },

  // 打开日志文件目录
  openLogFolder: () => {
    return ipcRenderer.invoke('log:open-folder');
  },

  // 执行任务
  executeTask: (taskName: any) => {
    return ipcRenderer.invoke('task:execute', taskName);
  },
});
