// 文件：/src/lib/todo/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_Todo, E_IpcNotice_Todo, type TodoItem } from "./type";

/**
 * todo 模块渲染进程 API（由 preload 聚合暴露为 window.api.todo）
 */
export const todoApi = {
  /** 读取全部待办 */
  getAll: (): Promise<TodoItem[]> => {
    return ipcRenderer.invoke(E_IpcEvent_Todo.Get);
  },

  /** 保存全部待办 */
  save: (todos: TodoItem[]): Promise<boolean> => {
    return ipcRenderer.invoke(E_IpcEvent_Todo.Set, todos);
  },

  /** 监听「聚焦输入框」通知（返回解除监听函数） */
  onFocusInput: (handler: () => void): (() => void) => {
    const listener = () => handler();
    ipcRenderer.on(E_IpcNotice_Todo.FocusInput, listener);
    return () => ipcRenderer.removeListener(E_IpcNotice_Todo.FocusInput, listener);
  },
};

export type TodoApi = typeof todoApi;
