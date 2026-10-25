// 文件：/src/renderer/types/global.d.ts
// 与 /src/preload/index.ts 暴露的 api 树保持同步（强类型约定）

import type { TodoApi } from "../../lib/todo/ipcPreload";
import type { SystemApi } from "../../lib/system/ipcPreload";
import type { StoreApi } from "../../lib/store/ipcPreload";
import type { WindowPoolApi } from "../../lib/windowPool/ipcPreload";
import type { LoggerApi } from "../../lib/logger/ipcPreload";
import type { FeedbackApi } from "../../lib/feedback/ipcPreload";

declare global {
  interface Window {
    api: {
      todo: TodoApi;
      system: SystemApi;
      store: StoreApi;
      windowPool: WindowPoolApi;
      logger: LoggerApi;
      feedback: FeedbackApi;
    };
  }
}

export {};
