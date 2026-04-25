// 文件：/electron/main/index.ts

import { app, BrowserWindow } from "electron";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

const isDev = process.env.NODE_ENV === "development";

/* 生命周期日志辅助函数 */
function logLifecycle(eventName: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`;
  const windowCount = BrowserWindow.getAllWindows().length;
  console.log(`生命周期：${eventName} | ${time} | 窗口数量：${windowCount}`);
}

/* 1 创建窗口 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      // 通过预加载脚本安全地暴露 API，预加载脚本通过 webPreferences.preload 配置，被注入到渲染进程中。它的代码会在渲染进程启动时、网页脚本加载前被执行。
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true, // 隔离渲染进程和预加载脚本的上下文
      nodeIntegration: false, // 禁止渲染进程直接使用 Node.js API
    },
  });

  // 设置 CSP 响应头(生产环境更严格)
  if (!isDev) {
    win.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
            ],
          },
        });
      },
    );
  }

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "dist/index.html"));
  }
}

/* 2 应用生命周期 */
// 启动阶段
app.on("ready", () => logLifecycle("ready"));
app.whenReady().then(() => {
  logLifecycle("whenReady");
  createWindow();

  app.on("activate", () => {
    logLifecycle("activate");

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 运行阶段
app.on("browser-window-created", () => logLifecycle("browser-window-created"));
app.on("browser-window-focus", () => logLifecycle("browser-window-focus"));
app.on("browser-window-blur", () => logLifecycle("browser-window-blur"));

// 关闭阶段
app.on("window-all-closed", () => {
  logLifecycle("window-all-closed");
  // macOS 特殊行为
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("before-quit", () => logLifecycle("before-quit"));
app.on("will-quit", () => logLifecycle("will-quit"));
app.on("quit", () => logLifecycle("quit"));

/* 3 注册 IPC 处理器  */
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
