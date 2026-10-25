// 文件：/src/lib/feedback/ipcPreload.ts

import { ipcRenderer } from "electron";
import { E_IpcEvent_Feedback, type FeedbackSubmitResult } from "./type";

/**
 * feedback 模块渲染进程 API（由 preload 聚合暴露为 window.api.feedback）
 */
export const feedbackApi = {
  /** 提交用户反馈（附带最近日志） */
  submit: (description: string): Promise<FeedbackSubmitResult> => {
    return ipcRenderer.invoke(E_IpcEvent_Feedback.Submit, description);
  },
};

export type FeedbackApi = typeof feedbackApi;
