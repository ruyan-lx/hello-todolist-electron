// 文件：/src/renderer/types/global.d.ts

interface Window {
  api: {
    invoke: (channel: string, data?: any) => Promise<any>
  }
}