// 文件：/src/lib/system/type.ts

/**
 * system 模块（系统通知 / 对话框 / 演示任务）IPC 通道枚举
 */
export enum E_IpcEvent_System {
  /** 发送系统通知 */
  Notify = "notify",
  /** 弹出信息对话框 */
  DialogInfo = "dialog:info",
  /** 执行演示任务（模拟随机失败） */
  TaskExecute = "task:execute",
}

/** 通知参数 */
export interface NotifyOptions {
  title: string;
  body: string;
}

/** 任务执行结果 */
export interface TaskExecuteResult {
  success: boolean;
  elapsed?: number;
  error?: string;
}
