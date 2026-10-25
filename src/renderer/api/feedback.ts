// 文件：/src/renderer/api/feedback.ts
// feedback 域渲染层 API：封装 window.api.feedback，浏览器环境安全降级

import type { FeedbackSubmitResult } from "@/lib/feedback/type";

const hasApi = () => typeof window !== "undefined" && Boolean(window.api);

export const feedbackApi = {
  /** 提交用户反馈（附带最近日志） */
  submit: async (description: string): Promise<FeedbackSubmitResult | null> => {
    if (!hasApi()) return null;
    return window.api.feedback.submit(description);
  },
};
