// 文件：/src/lib/feedback/type.ts

/**
 * feedback 模块（用户反馈 + 日志上报）IPC 通道枚举
 */
export enum E_IpcEvent_Feedback {
  Submit = "feedback:submit",
}

/** 反馈提交结果 */
export interface FeedbackSubmitResult {
  success: boolean;
  error?: string;
}
