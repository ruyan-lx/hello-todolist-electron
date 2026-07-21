// 文件：/electron/main/index.ts

import { app, BrowserWindow, Notification, dialog, Tray, Menu, nativeImage } from "electron";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

// 开发环境由 Vite 注入；存在则走热更新地址
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const isDev = Boolean(devServerUrl);

// 保证应用只运行一个实例；拿不到锁则直接退出
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
// 区分“真正退出”和“关闭窗口隐藏到托盘”
let isQuitting = false;

/* 生命周期日志辅助函数：打印事件名、时间与当前窗口数 */
function logLifecycle(eventName: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  const windowCount = BrowserWindow.getAllWindows().length;
  console.log(`生命周期：${eventName} | ${time} | 窗口数量：${windowCount}`);
}

/* 显示并聚焦主窗口（处理最小化场景） */
function showMainWindow() {
  // 窗口尚未创建时直接返回
  if (!mainWindow) return;

  // 若处于最小化状态，先恢复再显示
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

  // 开发/生产环境下资源路径不同
  const iconPath = isDev
    ? path.join(__dirname, "../../electron/assets/tray-icon.png")
    : path.join(process.resourcesPath, "electron/assets/tray-icon.png");
  icon = nativeImage.createFromPath(iconPath);

  // 调整图标大小（Windows 托盘图标推荐 16x16）
  icon = icon.resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  // 右键菜单：显示窗口 / 新建待办 / 退出
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        showMainWindow();
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
        // 标记为真正退出，避免 close 事件再次拦截
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("hello-todolist");
  tray.setContextMenu(contextMenu);

  // 单击托盘图标：可见则隐藏，否则显示
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      showMainWindow();  //  或者 mainWindow.show();
    }
  });
}

/* 创建主窗口 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      // 通过预加载脚本安全地暴露 API；在网页脚本加载前执行
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true, // 隔离渲染进程和预加载脚本的上下文
      nodeIntegration: false, // 禁止渲染进程直接使用 Node.js API
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
    console.log("🚪 窗口关闭事件触发, isQuitting:", isQuitting);
    if (!isQuitting) {
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

  return win;
}



/* 应用生命周期 ************************/
// 启动阶段
app.on("ready", () => logLifecycle("ready"));
app.whenReady().then(() => {
  // 非首个实例不继续初始化
  if (!hasSingleInstanceLock) return;

  logLifecycle("whenReady");
  // 1. 创建主窗口
  createWindow();
  // 2. 创建系统托盘
  createTray();

  // macOS：点击 Dock 图标时重新创建/显示窗口
  app.on("activate", () => {
    logLifecycle("activate");

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    showMainWindow();
  });
});

// 运行阶段
app.on("browser-window-created", () => logLifecycle("browser-window-created")); // 窗口创建完毕
// app.on("browser-window-focus", () => logLifecycle("browser-window-focus"));  // 窗口获得焦点
// app.on("browser-window-blur", () => logLifecycle("browser-window-blur"));    // 窗口失去焦点

// 关闭阶段: 所有窗口关闭时触发
app.on("window-all-closed", () => {
  logLifecycle("window-all-closed");
  // macOS 通常保持应用常驻；其他平台关闭全部窗口后退出
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

// 第二个实例启动时，聚焦已有主窗口
if (hasSingleInstanceLock) {
  app.on("second-instance", showMainWindow);
}




/* 注册 IPC 处理器 *************************/
// 系统通知
ipcMain.handle("notify", (_, { title, body }) => {
  new Notification({
    title,
    body,
  }).show();
});

// 信息对话框
ipcMain.handle("dialog:info", async (_, message) => {
  await dialog.showMessageBox({
    type: "info",
    title: "提示",
    message,
    buttons: ["确定"],
  });
});

// 待办数据持久化路径（用户数据目录）
const filePath = path.join(app.getPath("userData"), "todo.json");

// 打印实际路径，方便调试
console.log("📁 Todo 文件路径:", filePath);
console.log("📂 userData 目录:", app.getPath("userData"));

// todo:get / todo:set：读写 todo.json
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
