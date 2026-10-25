// 文件：/src/preload/index.ts

import { contextBridge } from "electron";
import { todoApi } from "../lib/todo/ipcPreload";
import { systemApi } from "../lib/system/ipcPreload";
import { storeApi } from "../lib/store/ipcPreload";
import { windowPoolApi } from "../lib/windowPool/ipcPreload";
import { loggerApi } from "../lib/logger/ipcPreload";
import { feedbackApi } from "../lib/feedback/ipcPreload";

/*
使用 contextBridge 在渲染进程的 window 对象上暴露 api 对象，
作为安全桥梁，只暴露按业务域封装的强类型 API，不直接暴露 Node.js 能力。
主进程配置了 contextIsolation: true 和 nodeIntegration: false。

新增业务域时：import 对应模块的 ipcPreload 并在下方 api 树中挂载即可。
注意：严禁从 ../lib/index.ts 聚合入口 import（会引入主进程专用依赖），
必须直接引用各模块具体的 ./xxx/ipcPreload.ts。
*/
const api = {
  todo: todoApi,
  system: systemApi,
  store: storeApi,
  windowPool: windowPoolApi,
  logger: loggerApi,
  feedback: feedbackApi,
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("api", api);
} else {
  // @ts-ignore 降级场景（未开启上下文隔离）
  window.api = api;
}
