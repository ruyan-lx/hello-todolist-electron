// 文件：/src/lib/system/ipcReceive.ts

import { Notification, dialog } from "electron";
import { ipcMain } from "electron";
import { getLogger } from "../logger/loggerService";
import { E_IpcEvent_System } from "./type";

/**
 * 注册 system 模块主进程 IPC 处理器
 */
export function registerSystemIpc(): void {
  // 系统通知
  ipcMain.handle(E_IpcEvent_System.Notify, (_, { title, body }: { title: string; body: string }) => {
    new Notification({ title, body }).show();
  });

  // 信息对话框
  ipcMain.handle(E_IpcEvent_System.DialogInfo, async (_, message: string) => {
    await dialog.showMessageBox({
      type: "info",
      title: "提示",
      message,
      buttons: ["确定"],
    });
  });

  // 模拟业务操作：用户执行某个任务
  ipcMain.handle(E_IpcEvent_System.TaskExecute, async (_event, taskName: string) => {
    const taskLogger = getLogger("Task");

    taskLogger.info(`开始执行任务: ${taskName}`);
    const startTime = Date.now();

    try {
      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟随机失败
      if (Math.random() < 0.3) {
        throw new Error(`任务 "${taskName}" 执行超时`);
      }

      const elapsed = Date.now() - startTime;
      taskLogger.info(`任务完成: ${taskName}, 耗时 ${elapsed}ms`);

      return { success: true, elapsed };
    } catch (err: any) {
      taskLogger.error(`任务失败: ${taskName}`, err.message);
      return { success: false, error: err.message };
    }
  });
}
