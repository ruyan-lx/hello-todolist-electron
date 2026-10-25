// 文件：/src/renderer/api/store.ts
// store 域渲染层 API：封装 window.api.store，浏览器环境安全降级

const hasApi = () => typeof window !== "undefined" && Boolean(window.api);

export const storeApi = {
  /** 读取指定键 */
  get: async <T = unknown>(key: string): Promise<T | undefined> => {
    if (!hasApi()) return undefined;
    return window.api.store.get<T>(key);
  },

  /** 写入指定键 */
  set: async (key: string, value: unknown): Promise<boolean> => {
    if (!hasApi()) return false;
    return window.api.store.set({ key, value });
  },

  /** 删除指定键 */
  delete: async (key: string): Promise<boolean> => {
    if (!hasApi()) return false;
    return window.api.store.delete(key);
  },

  /** 清空全部键值 */
  clear: async (): Promise<boolean> => {
    if (!hasApi()) return false;
    return window.api.store.clear();
  },
};
