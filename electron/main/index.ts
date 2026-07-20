// 文件：/electron/main/index.ts

import { app, BrowserWindow, Notification, dialog, Tray, Menu, nativeImage } from "electron";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(devServerUrl);
const hasSingleInstanceLock = app.requestSingleInstanceLock();

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

if (!hasSingleInstanceLock) {
  app.quit();
}

/* 生命周期日志辅助函数 */
function logLifecycle(eventName: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  const windowCount = BrowserWindow.getAllWindows().length;
  console.log(`生命周期：${eventName} | ${time} | 窗口数量：${windowCount}`);
}

function showMainWindow() {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

/* 创建系统托盘 */
function createTray() {
  // 使用 nativeImage 创建图标（Windows 推荐使用 ICO 或通过 nativeImage 创建）
  let icon: Electron.NativeImage;

  // 方案1: 尝试从文件加载
  const iconPath = isDev
    ? path.join(__dirname, "../../electron/assets/tray-icon.png")
    : path.join(process.resourcesPath, "electron/assets/tray-icon.png");
  icon = nativeImage.createFromPath(iconPath);

  // 调整图标大小（Windows 托盘图标推荐 16x16）
  icon = icon.resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        showMainWindow()
      },
    },
    {
      label: "新建待办",
      click: () => {
        showMainWindow();
        // 通知渲染进程聚焦输入框
        mainWindow?.webContents.send("focus-input");
      },
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("hello-todolist");
  tray.setContextMenu(contextMenu);

  // 单击托盘图标显示窗口
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showMainWindow();
    }
  });
}

/* 1 创建窗口 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      // 通过预加载脚本安全地暴露 API，预加载脚本通过 webPreferences.preload 配置，被注入到渲染进程中。它的代码会在渲染进程启动时、网页脚本加载前被执行。
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true, // 隔离渲染进程和预加载脚本的上下文
      nodeIntegration: false, // 禁止渲染进程直接使用 Node.js API
    },
  });
  mainWindow = win;
  // win.setMenuBarVisibility(false); // 隐藏菜单栏
  // 生产环境设置 CSP（内容安全策略）响应头，限制资源加载来源，防止 XSS 攻击
  // 开发环境不设置，避免影响热更新等开发工具的正常运行
  if (!isDev) {
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          // 仅允许加载同源资源；样式允许内联（'unsafe-inline'）以支持框架动态注入的样式
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
          ],
        },
      });
    });
  }

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools(); // 打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // 拦截窗口关闭事件，改为隐藏到托盘
  win.on("close", (event) => {
    console.log("🚪 窗口关闭事件触发, isQuitting:", isQuitting);
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  return win;
}

/* 2 应用生命周期 */
// 启动阶段
if (hasSingleInstanceLock) {
  app.on("second-instance", showMainWindow);
}
app.on("ready", () => logLifecycle("ready"));
app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;

  logLifecycle("whenReady");
  createWindow();
  createTray();

  app.on("activate", () => {
    logLifecycle("activate");

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    showMainWindow();
  });
});

// 运行阶段
app.on("browser-window-created", () => logLifecycle("browser-window-created"));
// app.on("browser-window-focus", () => logLifecycle("browser-window-focus"));
// app.on("browser-window-blur", () => logLifecycle("browser-window-blur"));

// 关闭阶段
app.on("window-all-closed", () => {
  logLifecycle("window-all-closed");
  // macOS 特殊行为
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => {
  logLifecycle("before-quit");
  isQuitting = true;
});
app.on("will-quit", () => logLifecycle("will-quit"));
app.on("quit", () => logLifecycle("quit"));

/* 3 注册 IPC 处理器  */
// 通知
ipcMain.handle("notify", (_, { title, body }) => {
  new Notification({
    title,
    body,
  }).show();
});

ipcMain.handle("dialog:info", async (_, message) => {
  await dialog.showMessageBox({
    type: "info",
    title: "提示",
    message,
    buttons: ["确定"],
  });
});

// 存储路径（用户目录）
const filePath = path.join(app.getPath("userData"), "todo.json");

// 打印实际路径，方便调试
console.log("📁 Todo 文件路径:", filePath);
console.log("📂 userData 目录:", app.getPath("userData"));

// 使用 ipcMain.handle() 注册两个通道：todo:get 和 todo:set 负责文件系统操作（读写 todo.json）
// 读取
ipcMain.handle("todo:get", () => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("读取失败:", error);
    return [];
  }
});
// 保存
ipcMain.handle("todo:set", (_, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("写入失败:", error);
    return false;
  }
});
