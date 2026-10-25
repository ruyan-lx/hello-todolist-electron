// 文件：/src/lib/feedback/ipcReceive.ts

import { app } from "electron";
import { ipcMain } from "electron";
import fs from "fs";
import type log from "electron-log/main";
import { E_IpcEvent_Feedback, type FeedbackSubmitResult } from "./type";

/** 反馈上报接口地址（替换为实际服务端地址后生效） */
const FEEDBACK_URL = "https://your-server.com/api/feedback";

/** 读取最近 N 行日志 */
function readRecentLogs(logger: typeof log, maxLines = 500): string {
  const logFile = logger.transports.file.getFile().path;

  try {
    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.split("\n");
    return lines.slice(-maxLines).join("\n");
  } catch (err: any) {
    return `读取日志失败: ${err.message}`;
  }
}

/** 上传日志到服务器 */
async function uploadFeedback(logger: typeof log, userDescription: string, logContent: string): Promise<boolean> {
  const response = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: userDescription,
      logs: logContent,
      version: app.getVersion(),
      platform: process.platform,
      timestamp: new Date().toISOString(),
    }),
  });
  logger.info("用户描述:", userDescription, "日志详情:", logContent, "网络响应:", response.status);
  return response.ok;
}

/**
 * 注册 feedback 模块主进程 IPC 处理器
 * @param log 主进程入口初始化后的 electron-log 实例
 */
export function registerFeedbackIpc(logger: typeof log): void {
  ipcMain.handle(E_IpcEvent_Feedback.Submit, async (_event, description: string): Promise<FeedbackSubmitResult> => {
    const feedbackLog = logger.scope("Feedback");
    feedbackLog.info("用户提交反馈");

    const logs = readRecentLogs(logger, 500); // 只取最近 500 行

    try {
      const ok = await uploadFeedback(logger, description, logs);
      feedbackLog.info(`反馈上传${ok ? "成功" : "失败"}`);
      return { success: ok };
    } catch (err: any) {
      feedbackLog.error("反馈上传异常:", err.message);
      return { success: false, error: err.message };
    }
  });
}
