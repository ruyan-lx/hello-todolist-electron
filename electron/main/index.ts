// 文件：/electron/main/index.ts

import { app, BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'


/* 1 创建窗口 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // 通过预加载脚本安全地暴露 API，预加载脚本通过 webPreferences.preload 配置，被注入到渲染进程中。它的代码会在渲染进程启动时、网页脚本加载前被执行。
      preload: path.join(__dirname, '../preload/index.js'), 
      contextIsolation: true,  // 隔离渲染进程和预加载脚本的上下文
      nodeIntegration: false,  // 禁止渲染进程直接使用 Node.js API
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'))
  }
}


/* 2 应用生命周期 */
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})
app.on('window-all-closed', () => {
  // macOS 特殊行为
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/* 3 注册 IPC 处理器  */
// 存储路径（用户目录）
const filePath = path.join(app.getPath('userData'), 'todo.json')

// 打印实际路径，方便调试
console.log('📁 Todo 文件路径:', filePath)
console.log('📂 userData 目录:', app.getPath('userData'))

// 使用 ipcMain.handle() 注册两个通道：todo:get 和 todo:set 负责文件系统操作（读写 todo.json）
// 读取
ipcMain.handle('todo:get', () => {
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
})
// 保存
ipcMain.handle('todo:set', (_, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data))
  return true
})