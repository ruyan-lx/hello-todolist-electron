// 文件：/src/lib/store/type.ts

/**
 * store 模块（electron-store 键值持久化）IPC 通道枚举
 */
export enum E_IpcEvent_Store {
  Get = "store:get",
  Set = "store:set",
  Delete = "store:delete",
  Clear = "store:clear",
}

/** 写入参数 */
export interface StoreSetPayload {
  key: string;
  value: unknown;
}
