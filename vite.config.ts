// 文件：/vite.config.ts

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程入口
        entry: "electron/main/index.ts",
        vite: {
          build: {
            outDir: "dist-electron/main",
          },
        },
      },
      {
        // preload 脚本入口
        entry: "electron/preload/index.ts",
        onstart(options) {
          // preload 改变时只需要刷新页面
          options.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron/preload",
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
