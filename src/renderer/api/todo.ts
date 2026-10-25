// 文件：/src/renderer/api/todo.ts
// todo 域渲染层 API：封装 window.api.todo，浏览器环境安全降级

import type { TodoItem } from "@/lib/todo/type";

const hasApi = () => typeof window !== "undefined" && Boolean(window.api);

export const todoApi = {
  /** 读取全部待办 */
  getAll: (): Promise<TodoItem[]> => {
    return hasApi() ? window.api.todo.getAll() : Promise.resolve([]);
  },

  /** 保存全部待办 */
  save: (todos: TodoItem[]): Promise<boolean> => {
    return hasApi() ? window.api.todo.save(todos) : Promise.resolve(false);
  },

  /** 监听「聚焦输入框」通知（返回解除监听函数） */
  onFocusInput: (handler: () => void): (() => void) => {
    if (!hasApi()) return () => {};
    return window.api.todo.onFocusInput(handler);
  },
};
