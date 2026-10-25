// 文件：/src/lib/store/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_Store, type StoreSetPayload } from "./type";

/**
 * store 模块渲染进程 API（由 preload 聚合暴露为 window.api.store）
 */
export const storeApi = {
  /** 读取指定键 */
  get: <T = unknown>(key: string): Promise<T | undefined> => {
    return ipcRenderer.invoke(E_IpcEvent_Store.Get, key);
  },

  /** 写入指定键 */
  set: (payload: StoreSetPayload): Promise<boolean> => {
    return ipcRenderer.invoke(E_IpcEvent_Store.Set, payload);
  },

  /** 删除指定键 */
  delete: (key: string): Promise<boolean> => {
    return ipcRenderer.invoke(E_IpcEvent_Store.Delete, key);
  },

  /** 清空全部键值 */
  clear: (): Promise<boolean> => {
    return ipcRenderer.invoke(E_IpcEvent_Store.Clear);
  },
};

export type StoreApi = typeof storeApi;
