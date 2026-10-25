// 文件：/src/main/index.ts

import { app, BrowserWindow } from "electron";
import type { Rectangle } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { WindowManager } from "../lib/windowPool/WindowManager";
import { createTray, getIsQuitting, markQuitting, showMainWindow } from "./tray";
import { initLogger, getLogger } from "../lib/logger/loggerService";
import { RenderCrashRecovery } from "../lib/crashRecovery/RenderCrashRecovery";
import { setupAllIpcHandlers } from "../lib";

// ====== 第一步：初始化日志（必须在最前面） ======
const log = initLogger();
const logger = getLogger("App");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 开发环境由 Vite 注入；存在则走热更新地址
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(devServerUrl);

// 保证应用只运行一个实例；拿不到锁则直接退出
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let windowManager: WindowManager | null = null;

// 渲染进程崩溃自动恢复：60s 内 >= 3 次崩溃则暂停自动恢复并弹窗询问用户
const crashRecovery = new RenderCrashRecovery(
  {
    info: (msg) => logger.info(msg),
    warn: (msg) => logger.warn(msg),
    error: (msg) => logger.error(msg),
  },
  { loopWindowMs: 60_000, maxCrashes: 3 },
);

/* 创建主窗口 */
function createWindow(bounds?: Rectangle): BrowserWindow {
  logger.info("创建主窗口...");
  const win = new BrowserWindow({
    width: bounds?.width ?? 1600,
    height: bounds?.height ?? 1000,
    x: bounds?.x,
    y: bounds?.y,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      // 通过预加载脚本安全地暴露 API；在网页脚本加载前执行
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true, // 隔离渲染进程和预加载脚本的上下文
      nodeIntegration: false, // 禁止渲染进程直接使用 Node.js API
      sandbox: false,
    },
  });
  mainWindow = win;

  // 生产环境设置 CSP，限制资源加载来源，防止 XSS
  // 开发环境不设置，避免影响热更新等开发工具
  if (!isDev) {
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          // 仅允许同源资源；样式允许内联以支持框架动态注入
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
          ],
        },
      });
    });
  }

  // 开发环境加载 Vite 服务；生产环境加载打包后的静态文件
  if (devServerUrl) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools(); // 打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // 拦截关闭：非退出时隐藏到托盘，而不是销毁窗口
  win.on("close", (event) => {
    if (!getIsQuitting()) {
      event.preventDefault();
      win.hide();
    }
  });

  // 窗口真正销毁后清理引用
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  // 页面加载失败
  win.webContents.on("did-fail-load", (_event, errorCode, errorDesc) => {
    logger.error(`页面加载失败: code=${errorCode}, desc=${errorDesc}`);
  });

  // 渲染进程崩溃：交给统一的崩溃恢复模块处理
  // 策略：oom/crash/abnormal-exit/launch-failed/integrity-failure → 销毁重建；
  //       killed → 尝试 reload；clean-exit → 正常退出，不做恢复；
  //       60s 内 >= 3 次崩溃 → 暂停自动恢复并弹窗让用户选择「重启」或「退出」
  crashRecovery.attach(win, {
    recreate: (crashBounds) => {
      // 崩溃前的窗口位置与尺寸由模块捕获并通过 bounds 传入
      return createWindow(crashBounds);
    },
  });

  // 未捕获的控制台错误（从渲染进程转发过来）
  win.webContents.on("console-message", (_event, level, message) => {
    if (level >= 2) {
      logger.warn(`[Renderer Console] ${message}`);
    }
  });

  logger.info("主窗口创建完成");
  return win;
}

/* 生命周期日志辅助函数：打印事件名、时间与当前窗口数 */
function logLifecycle(eventName: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  const windowCount = BrowserWindow.getAllWindows().length;
  console.log(`生命周期：${eventName} | ${time} | 窗口数量：${windowCount}`);
}

/* 应用生命周期 ************************/
app.on("ready", () => logLifecycle("ready"));
app.whenReady().then(() => {
  logger.info("====================================");
  logger.info(`应用启动 v${app.getVersion()}`);
  logger.info(`系统: ${process.platform} ${process.arch}`);
  logger.info(`Electron: ${process.versions.electron}`);
  logger.info(`Chrome: ${process.versions.chrome}`);
  logger.info(`Node: ${process.versions.node}`);
  logger.info("====================================");

  // 非首个实例不继续初始化
  if (!hasSingleInstanceLock) return;

  logLifecycle("whenReady");
  // 1. 创建主窗口
  createWindow();
  // 2. 创建系统托盘
  createTray(() => mainWindow);
  // 3. 子窗口按需创建，最多保留 3 个
  windowManager = new WindowManager(3);

  // 4. 统一注册各业务域 IPC 处理器（IPC 注册中心）
  setupAllIpcHandlers({
    getWindowManager: () => windowManager,
    log,
  });

  // macOS：点击 Dock 图标时重新创建/显示窗口
  app.on("activate", () => {
    logLifecycle("activate");

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    showMainWindow(mainWindow);
  });
});

// 运行阶段
app.on("browser-window-created", () => logLifecycle("browser-window-created")); // 窗口创建完毕

// 关闭阶段: 所有窗口关闭时触发
app.on("window-all-closed", () => {
  logLifecycle("window-all-closed");
  logger.info("所有窗口已关闭");
  // macOS 通常保持应用常驻；其他平台关闭全部窗口后退出
  if (process.platform !== "darwin") {
    app.quit();
  }
});
// before-quit / will-quit：应用退出前的最后时机，适合执行保存数据、释放资源等清理工作。
app.on("before-quit", () => {
  logLifecycle("before-quit");
  logger.info("应用即将退出");
  markQuitting();
});
app.on("will-quit", () => logLifecycle("will-quit"));
app.on("quit", () => logLifecycle("quit"));

// 1. 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 2. 捕获未捕获的同步异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);

  // 执行必要的清理操作（如关闭数据库连接）
  // cleanup(); 

  // 主动退出进程，避免状态污染导致不可预知的行为
  process.exit(1);
});


// 第二个实例启动时，聚焦已有主窗口
if (hasSingleInstanceLock) {
  app.on("second-instance", () => showMainWindow(mainWindow));
}
