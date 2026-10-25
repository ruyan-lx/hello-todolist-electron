// 文件：/src/main/tray.ts

import { app, Tray, Menu, nativeImage } from "electron";
import type { BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { E_IpcNotice_Todo } from "../lib/todo/type";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 区分“真正退出”和“关闭窗口隐藏到托盘” */
let isQuitting = false;

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function markQuitting(): void {
  isQuitting = true;
}

/* 显示并聚焦主窗口（处理最小化场景） */
export function showMainWindow(mainWindow: BrowserWindow | null): void {
  if (!mainWindow) return;

  // 若处于最小化状态，先恢复再显示
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

/* 创建系统托盘 */
export function createTray(getMainWindow: () => BrowserWindow | null): void {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  // 开发/生产环境下资源路径不同
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "resources/tray-icon.png")
    : path.join(__dirname, "../../resources/tray-icon.png");
  let icon = nativeImage.createFromPath(iconPath);

  // 调整图标大小（Windows 托盘图标推荐 16x16）
  icon = icon.resize({ width: 16, height: 16 });
  const tray = new Tray(icon);

  // 右键菜单：显示窗口 / 新建待办 / 退出
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示窗口",
      click: () => {
        showMainWindow(getMainWindow());
      },
    },
    {
      label: "新建待办",
      click: () => {
        showMainWindow(getMainWindow());
        // 通知渲染进程聚焦输入框
        getMainWindow()?.webContents.send(E_IpcNotice_Todo.FocusInput);
      },
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        // 标记为真正退出，避免 close 事件再次拦截
        markQuitting();
        app.quit();
      },
    },
  ]);

  tray.setToolTip("hello-todolist");
  tray.setContextMenu(contextMenu);

  // 单击托盘图标：可见则隐藏，否则显示
  tray.on("click", () => {
    const win = getMainWindow();
    if (!win) return;
    if (win.isVisible()) {
      win.hide();
    } else {
      showMainWindow(win);
    }
  });
}
