// 文件：/src/lib/crashRecovery/RenderCrashRecovery.ts
//
// 渲染进程崩溃自动恢复模块
//
// details.reason 全量取值（Electron 官方定义）：
//  - clean-exit        : 进程以 exit code 0 正常退出（如页面主动跳转/关闭）→ 不应自动恢复
//  - killed            : 进程被 SIGTERM/SIGKILL（任务管理器、系统 OOM Killer 等）→ 尝试 reload
//  - crash             : 段错误等 Native 崩溃（SIGSEGV 等）→ 销毁重建
//  - oom               : 内存耗尽 → 销毁重建（reload 无法释放已泄漏的内存）
//  - launch-failed     : 渲染进程启动失败 → 销毁重建
//  - abnormal-exit     : 进程以非零码退出（如辅助进程崩溃）→ 销毁重建
//  - integrity-failure : Windows 代码完整性校验失败（常见于安全软件 DLL 注入）→ 销毁重建通常无效，仍走重建并提示
//
// 崩溃循环防护：短时间（默认 60s）内超过 maxCrashes 次（默认 3 次）后暂停自动恢复，
// 弹出对话框让用户选择「重启应用」或「退出应用」。

import { app, dialog } from "electron";
import type { BrowserWindow, Rectangle } from "electron";

export type RenderCrashReason =
  | "clean-exit"
  | "abnormal-exit"
  | "killed"
  | "crash"
  | "oom"
  | "launch-failed"
  | "integrity-failure";

/** 各崩溃原因对应的恢复策略 */
type RecoveryPolicy = "recreate" | "reload" | "ignore";

const RECOVERY_POLICY: Record<RenderCrashReason, RecoveryPolicy> = {
  oom: "recreate",
  crash: "recreate",
  "abnormal-exit": "recreate",
  "launch-failed": "recreate",
  "integrity-failure": "recreate",
  killed: "reload",
  "clean-exit": "ignore",
};

export interface RenderCrashLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface AttachOptions {
  /**
   * 销毁旧窗口并创建新窗口的回调。
   * bounds 为崩溃前窗口的位置与尺寸（可能为空），便于新窗口还原原位。
   * 返回新窗口；crash-recovery 模块只负责销毁与调度，不关心窗口如何创建。
   */
  recreate: (bounds?: Rectangle) => BrowserWindow | null;
}

export interface RecoveryOptions {
  /** 崩溃循环判定的时间窗口（毫秒），默认 60_000 */
  loopWindowMs?: number;
  /** 时间窗口内允许的最大崩溃次数，超过则暂停自动恢复，默认 3 */
  maxCrashes?: number;
}

export class RenderCrashRecovery {
  private readonly loopWindowMs: number;
  private readonly maxCrashes: number;
  private readonly logger: RenderCrashLogger;

  /** 崩溃时间戳（滑动窗口，用于循环防护） */
  private crashTimestamps: number[] = [];
  /** 自动恢复是否已因崩溃循环被暂停 */
  private suspended = false;

  constructor(logger: RenderCrashLogger, options: RecoveryOptions = {}) {
    this.logger = logger;
    this.loopWindowMs = options.loopWindowMs ?? 60_000;
    this.maxCrashes = options.maxCrashes ?? 3;
  }

  /**
   * 为指定窗口的 webContents 挂载崩溃监听。
   * 每个主窗口调用一次即可。
   */
  attach(win: BrowserWindow, options: AttachOptions): void {
    win.webContents.on("render-process-gone", (_event, details) => {
      this.logger.info("渲染进程崩溃,崩溃原因:" + details.reason);
      console.log("渲染进程崩溃,崩溃原因:" + details.reason);
      this.handleCrash(win, details.reason as RenderCrashReason, details, options);
    });

    // 恢复成功后（页面完成一次加载）重置崩溃计数，避免历史崩溃长期累积触发误判
    win.webContents.on("did-finish-load", () => {
      if (this.crashTimestamps.length > 0) {
        this.logger.info("渲染进程加载成功，重置崩溃计数");
        this.crashTimestamps = [];
      }
    });
  }

  /** 单次崩溃处理入口 */
  private handleCrash(
    win: BrowserWindow,
    reason: RenderCrashReason,
    details: Electron.RenderProcessGoneDetails,
    options: AttachOptions,
  ): void {
    const { exitCode } = details;
    this.logger.error(`渲染进程崩溃: reason=${reason}, exitCode=${exitCode}, details=${JSON.stringify(details)}`);

    const policy = RECOVERY_POLICY[reason] ?? "reload";

    // 主动退出（页面跳转/正常关闭）不属于崩溃，不做任何恢复，避免违背用户意图
    if (policy === "ignore") {
      this.logger.warn(`reason=${reason} 为正常退出，跳过自动恢复`);
      return;
    }

    // ====== 崩溃循环防护 ======
    this.recordCrash();
    if (this.suspended || this.shouldSuspend()) {
      void this.showCrashLoopDialog(options);
      return;
    }

    // 崩溃事件回调内窗口状态不稳定，延后一拍再执行恢复操作
    setTimeout(() => {
      this.recover(win, reason, policy, options);
    }, 0);
  }

  /** 执行恢复策略 */
  private recover(
    win: BrowserWindow,
    reason: RenderCrashReason,
    policy: RecoveryPolicy,
    options: AttachOptions,
  ): void {
    if (policy === "recreate") {
      if (reason === "integrity-failure") {
        this.logger.warn("integrity-failure 通常由安全软件 DLL 注入引起，重建窗口大概率无法根治，请检查杀毒/安全软件设置");
      }
      this.logger.warn(`reason=${reason}，执行销毁重建窗口`);

      // 保留崩溃前的窗口位置与尺寸，通过 recreate 回调传给新窗口
      let bounds: Rectangle | undefined;
      if (!win.isDestroyed()) {
        try {
          bounds = win.getBounds();
        } catch {
          bounds = undefined;
        }
      }
      win.destroy();
      options.recreate(bounds);
      return;
    }

    // reload：killed / 未知原因
    if (win.isDestroyed()) {
      this.logger.warn("窗口已销毁，回退为重建窗口");
      options.recreate();
      return;
    }
    this.logger.warn(`reason=${reason}，尝试 webContents.reload() 恢复`);
    try {
      win.webContents.reload();
    } catch (err) {
      this.logger.error(`reload 失败，回退为重建窗口: ${String(err)}`);
      win.destroy();
      options.recreate();
    }
  }

  /** 记录一次崩溃并清理时间窗口外的记录 */
  private recordCrash(): void {
    const now = Date.now();
    this.crashTimestamps.push(now);
    this.crashTimestamps = this.crashTimestamps.filter(
      (t) => now - t <= this.loopWindowMs,
    );
  }

  /** 判断是否达到崩溃循环阈值（达到则置为 suspended） */
  private shouldSuspend(): boolean {
    if (this.crashTimestamps.length >= this.maxCrashes) {
      this.suspended = true;
      this.logger.error(
        `${this.loopWindowMs / 1000}s 内发生 ${this.crashTimestamps.length} 次崩溃，暂停自动恢复，等待用户选择`,
      );
      return true;
    }
    return false;
  }

  /** 崩溃循环兜底对话框：重启 / 退出 */
  private async showCrashLoopDialog(options: AttachOptions): Promise<void> {
    try {
      const { response } = await dialog.showMessageBox({
        type: "error",
        title: "应用崩溃",
        message: "应用多次崩溃，已暂停自动恢复",
        detail:
          "短时间内应用发生了多次崩溃。为了防止陷入崩溃循环，" +
          "请选择是否重启。若问题持续出现，建议查看日志文件或重新安装应用。",
        buttons: ["重启应用", "退出应用"],
        defaultId: 0,
        cancelId: 1, // 用户直接关闭对话框时视为「退出」，避免静默卡死
        noLink: true,
      });

      if (response === 0) {
        // 用户选择重启：重置状态并重建窗口
        this.logger.info("用户选择重启应用，重置崩溃计数并重建窗口");
        this.reset();
        options.recreate();
      } else {
        this.logger.info("用户选择退出应用");
        app.quit();
      }
    } catch (err) {
      this.logger.error(`崩溃循环对话框展示失败: ${String(err)}`);
    }
  }

  /** 重置崩溃计数与暂停状态（例如用户手动确认恢复后调用） */
  reset(): void {
    this.crashTimestamps = [];
    this.suspended = false;
  }
}
