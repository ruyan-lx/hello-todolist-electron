// 文件：/src/renderer/api/index.ts
// 渲染层统一 API 出口：组件一律经由本层调用主进程能力，禁止裸调 window.api

export { todoApi } from "./todo";
export { systemApi } from "./system";
export { storeApi } from "./store";
export { windowPoolApi } from "./windowPool";
export { feedbackApi } from "./feedback";
