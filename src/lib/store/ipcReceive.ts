// 文件：/src/lib/store/ipcReceive.ts

import { ipcMain } from "electron";
import Store from "electron-store";
import { E_IpcEvent_Store, type StoreSetPayload } from "./type";

/** 应用唯一的 electron-store 实例（store 与 todo 等模块共享，统一持久化范式） */
let mainStore: Store<Record<string, unknown>> | null = null;

/** 获取共享 Store 单例（懒初始化） */
export function getMainStore(): Store<Record<string, unknown>> {
  if (!mainStore) {
    mainStore = new Store<Record<string, unknown>>();
  }
  return mainStore;
}

/**
 * 注册 store 模块主进程 IPC 处理器
 */
export function registerStoreIpc(): void {
  const store = getMainStore();

  ipcMain.handle(E_IpcEvent_Store.Get, (_, key: string) => {
    return store.get(key);
  });

  ipcMain.handle(E_IpcEvent_Store.Set, (_, { key, value }: StoreSetPayload) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle(E_IpcEvent_Store.Delete, (_, key: string) => {
    store.delete(key);
    return true;
  });

  ipcMain.handle(E_IpcEvent_Store.Clear, () => {
    store.clear();
    return true;
  });
}
