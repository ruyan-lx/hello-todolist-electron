# hello-todolist

基于 **Electron + Vue 3 + TypeScript** 的待办事项桌面应用（Windows），架构参照「撞物 zhuangwu」项目：IPC 业务域三件套 + 统一注册中心 + 强类型 Preload。

## 快速开始

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（Vite 热更新 + Electron）
npm run typecheck  # 类型检查（node 端 tsc + web 端 vue-tsc）
npm run build      # 打包 NSIS 安装包（输出到 release/）
npm run build:dir  # 仅构建不生成安装包（release/win-unpacked）
```

## 目录结构

```
hello-todolist/
├── index.html                     # 渲染页面入口（挂载 #app）
├── vite.config.ts                 # Vite 配置：Vue 插件 + vite-plugin-electron（main/preload 双入口）
├── tsconfig.json                  # TS 方案壳（references 引下面两份）
├── tsconfig.node.json             # 主进程/预加载/lib 类型检查（tsc）
├── tsconfig.web.json              # 渲染层类型检查（vue-tsc，含 DOM lib）
├── package.json                   # 含 electron-builder 打包配置（NSIS、extraResources）
│
├── resources/                     # 打包随附的静态资源（托盘图标等）
│   └── tray-icon.png
│
├── src/
│   ├── main/                      # ===== 主进程：生命周期与组装，不写业务 IPC =====
│   │   ├── index.ts               # 入口：日志初始化、单实例锁、创建主窗口（CSP/加载/崩溃监听）、
│   │   │                          #   调用 setupAllIpcHandlers() 一行挂载全部 IPC、装配托盘与窗口池
│   │   └── tray.ts                # 系统托盘：右键菜单（显示/新建待办/退出）、isQuitting 退出状态管理
│   │
│   ├── preload/                   # ===== 预加载脚本：contextBridge 安全桥接 =====
│   │   └── index.ts               # 聚合 lib 各模块 ipcPreload，暴露强类型 window.api 树
│   │                              #   （api.todo.getAll() 而非弱类型 invoke 通道）
│   │
│   ├── lib/                       # ===== IPC 统一注册中心 + 业务域三件套（核心） =====
│   │   ├── index.ts               # setupAllIpcHandlers()：集中注册所有域的 ipcReceive，
│   │   │                          #   新增业务 = 建三件套目录 + 此处加一行
│   │   │
│   │   ├── todo/                  # 待办业务域
│   │   │   ├── type.ts            #   IPC 通道枚举（todo:get/set）+ TodoItem 类型（主/渲染共用）
│   │   │   ├── ipcReceive.ts      #   主进程 handler：electron-store 读写（含旧 todo.json 一次性迁移）
│   │   │   └── ipcPreload.ts      #   渲染端 API 封装：getAll / save / onFocusInput
│   │   │
│   │   ├── system/                # 系统能力域：系统通知、信息对话框、演示任务执行
│   │   ├── store/                 # 持久化域：electron-store 共享单例 getMainStore()，
│   │   │                          #   及 get/set/delete/clear 四个 IPC（todo 等模块复用此单例）
│   │   ├── windowPool/            # 窗口池域：WindowManager / WindowPool（LRU 复用，容量 3）
│   │   │                          #   + 演示窗口三件套
│   │   ├── logger/                # 日志域：loggerService（electron-log 初始化，文件轮转/异常捕获）
│   │   │                          #   + 渲染日志转发、打开日志目录 IPC
│   │   └── feedback/              # 反馈域：读取最近 500 行日志并上传的用户反馈 IPC
│   │
│   ├── renderer/                  # ===== 渲染层（Vue 3）=====
│   │   ├── main.ts                # 应用挂载
│   │   ├── App.vue                # 布局壳：只组装 views，不含业务逻辑
│   │   ├── api/                   # 按域封装 window.api 调用 + 浏览器环境安全降级
│   │   │                          #   （todo / system / store / windowPool / feedback + index 出口）
│   │   ├── composables/           # 逻辑复用层：useTodo（增删+持久化+托盘聚焦）、useWindowPool
│   │   ├── views/                 # 页面：TodoView（待办主界面）+
│   │   │                          #   4 个演示页（WindowPoolDemo / StoreDemo / FeedbackDemo / SdkMessageDemo）
│   │   ├── sdk/                   # 跨环境 SDK：message.ts（Electron 用对话框，浏览器用 alert）
│   │   ├── types/global.d.ts      # window.api 强类型声明（与 preload 的 api 树同步）
│   │   └── assets/styles/app.css  # 全局样式
│   └── assets/                    # 渲染层静态资源
│
├── dist/                          # 渲染层构建产物（构建生成）
├── dist-electron/                 # 主进程/preload 构建产物（构建生成）
└── release/                       # electron-builder 打包输出（构建生成）
```

## 架构说明

### 数据流（以添加待办为例）

```
TodoView.vue → composables/useTodo → api/todo.ts（降级守卫）
    → preload（api.todo.save，contextBridge）
    → lib/todo/ipcReceive（ipcMain.handle，channel 由 type.ts 枚举统一定义）
    → electron-store 落盘（原子写）
```

### 关键设计约定

- **三件套**：每个业务域固定 `type.ts`（通道枚举，单一事实来源）+ `ipcReceive.ts`（主进程注册）+ `ipcPreload.ts`（渲染端封装）；主进程入口通过注册中心 `setupAllIpcHandlers()` 一行挂载，永不膨胀。
- **依赖单向**：`main/` → `lib/` 单向依赖，`lib/` 内部自洽（窗口池、日志等基础设施都在 lib 中），渲染层禁止直接碰 Node 能力。
- **强类型边界**：`global.d.ts` 与 preload 的 api 树保持同步，channel 名写错在编译期报错，而不是运行时静默失败。
- **两套类型检查**：`tsconfig.node.json`（tsc）与 `tsconfig.web.json`（vue-tsc）分离，Node 端与 DOM 端全局类型互不污染。

### 数据存储

- 待办数据：electron-store 键 `todo-list`（`%APPDATA%/hello-todolist/config.json`，原子写）
- 旧版手写 `todo.json` 会在启动时自动迁移，原文件备份为 `todo.json.migrated.bak`
- 日志：`%APPDATA%/hello-todolist/logs/main.log`（10MB 轮转）
