# hello-todolist 架构重构总览（参照 zhuangwu）

## 完成了什么

按「撞物 zhuangwu」项目的架构模式，对 hello-todolist 做了完整重构，核心借鉴其 **IPC 业务域三件套 + 统一注册中心 + 强类型 preload** 设计。

## 改动清单

| 改动 | 说明 |
|---|---|
| 目录归位 | `electron/main` → `src/main`，`electron/preload` → `src/preload`，托盘图标 → `resources/` |
| IPC 注册中心 | 新增 `src/lib/index.ts` 导出 `setupAllIpcHandlers()`，主进程入口只调一行 |
| 六个业务域三件套 | `src/lib/` 下 todo / system / store / windowPool / logger / feedback，每个模块 = `type.ts`（通道枚举）+ `ipcReceive.ts`（主进程注册）+ `ipcPreload.ts`（API 封装） |
| 主进程瘦身 | index.ts 从 ~440 行减到 ~180 行；托盘拆出 `tray.ts` |
| 强类型 preload | 废弃弱类型 `invoke(channel, data)`，改为 `window.api.todo.getAll()` 等强类型 API 树 |
| 渲染层分层 | 新增 `api/`（按域封装 + 浏览器降级）、`composables/`（useTodo / useWindowPool）、`views/`（TodoView + 4 个演示组件迁入）；App.vue 只做布局 |
| 配置同步 | vite.config.ts 入口、package.json extraResources 路径更新 |

## 关键决策（已与用户确认）

- 保留 vite + vite-plugin-electron 构建链，不迁移 electron-vite
- 4 个演示组件保留并迁入 views/（用于验证 IPC 链路）
- 不写 lib 模块 docs/ 设计文档，暂不引入 Pinia

## 验证结果

- `npm run typecheck`（vue-tsc）✅ 通过
- `npm run dev` 冒烟 ✅ 主进程/preload 构建、窗口创建、托盘、todo 持久化路径均正常
- `electron-builder --dir` 打包 ✅ 资源嵌入路径 `resources/resources/tray-icon.png` 正确

## 遗留事项

- `release/win-unpacked/resources/app.asar` 被 WorkBuddy 与 Cursor 进程锁定无法删除（不影响新构建）；下次完整打包前关闭占用（如 Cursor 中打开过该文件）即可，或先手动删除 `release/win-unpacked`
- IPC 通道字符串与重构前完全一致，数据兼容；渲染层调用从 `window.api.invoke("todo:get")` 改为 `todoApi.getAll()`

## 高优先级架构问题修复（第二轮）

1. **依赖单向化**：WindowManager/WindowPool 下沉到 `src/lib/windowPool/`，logger 服务下沉到 `src/lib/logger/loggerService.ts`，`lib/` 不再反向依赖 `main/`，main 只做生命周期与组装
2. **tsconfig 拆分**：`tsconfig.json` 改为 references 壳；新增 `tsconfig.node.json`（tsc 管 main/preload/lib）与 `tsconfig.web.json`（vue-tsc 管 renderer），删除错误的 `"jsx": "react-jsx"`；typecheck 拆为 node/web 两步
3. **持久化统一**：todo 从手写 fs JSON 迁移到 electron-store（共享单例 `getMainStore()`，键 `todo-list`），含一次性迁移逻辑（旧 todo.json → store，备份为 `.migrated.bak`），消除非原子写与静默丢数据风险
