// 文件：/src/lib/todo/type.ts

/**
 * todo 模块 IPC 通道枚举（主进程 / preload 共用的单一事实来源）
 */
export enum E_IpcEvent_Todo {
  /** 读取全部待办 */
  Get = "todo:get",
  /** 保存全部待办 */
  Set = "todo:set",
}

/**
 * 主进程主动推送给渲染进程的通知通道
 */
export enum E_IpcNotice_Todo {
  /** 请求渲染进程聚焦待办输入框（托盘「新建待办」触发） */
  FocusInput = "focus-input",
}

/** 待办数据结构 */
export interface TodoItem {
  id: number;
  text: string;
}
