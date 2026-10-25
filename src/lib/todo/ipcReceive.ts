// 文件：/src/lib/todo/ipcReceive.ts

import { app } from "electron";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { getMainStore } from "../store/ipcReceive";
import { getLogger } from "../logger/loggerService";
import { E_IpcEvent_Todo, type TodoItem } from "./type";

/** electron-store 中待办数据的键名 */
const TODO_STORE_KEY = "todo-list";
/** 旧版手写 JSON 文件路径（用于一次性迁移） */
const legacyFilePath = path.join(app.getPath("userData"), "todo.json");

/** 读取共享 Store 中的待办列表 */
function readTodos(): TodoItem[] {
  const value = getMainStore().get(TODO_STORE_KEY);
  return Array.isArray(value) ? (value as TodoItem[]) : [];
}

/**
 * 一次性迁移：旧版手写 todo.json → electron-store
 * 仅在 store 中尚无数据、且旧文件存在并可解析时执行；
 * 迁移后将旧文件改名为 .migrated.bak 保留备份，不删除用户数据。
 */
function migrateLegacyTodoFile(): void {
  const store = getMainStore();
  if (store.has(TODO_STORE_KEY)) return;

  try {
    if (!fs.existsSync(legacyFilePath)) return;

    const raw = fs.readFileSync(legacyFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    store.set(TODO_STORE_KEY, parsed);
    const backupPath = `${legacyFilePath}.migrated.bak`;
    fs.renameSync(legacyFilePath, backupPath);
    getLogger("Todo").info(
      `已迁移旧 todo.json（${parsed.length} 条）到 electron-store，备份于 ${backupPath}`
    );
  } catch (error) {
    // 迁移失败不影响新写入路径，仅记录日志
    getLogger("Todo").error("迁移旧 todo.json 失败:", error);
  }
}

/**
 * 注册 todo 模块主进程 IPC 处理器
 * 持久化统一走 electron-store（原子写、防损坏），不再手写 fs JSON
 */
export function registerTodoIpc(): void {
  migrateLegacyTodoFile();

  // 读取待办
  ipcMain.handle(E_IpcEvent_Todo.Get, () => {
    return readTodos();
  });

  // 保存待办
  ipcMain.handle(E_IpcEvent_Todo.Set, (_, data: TodoItem[]) => {
    try {
      getMainStore().set(TODO_STORE_KEY, data);
      return true;
    } catch (error) {
      getLogger("Todo").error("待办写入失败:", error);
      return false;
    }
  });
}
