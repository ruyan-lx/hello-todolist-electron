import {
  WindowPool,
  type OpenWindowResult,
  type WindowPoolStats,
} from "./WindowPool";

export interface DemoWindowResult {
  id: number;
  reused: boolean;
  replacedDemo?: number;
  stats: WindowPoolStats;
}

export class WindowManager {
  private readonly pool: WindowPool;
  private demoNumber = 0;

  constructor(maxPoolSize = 3) {
    this.pool = new WindowPool(maxPoolSize, {
      title: "窗口池演示",
      autoHideMenuBar: true,
    });
  }

  openWindow(url: string): Promise<OpenWindowResult> {
    return this.pool.open(url);
  }

  async openDemoWindow(): Promise<DemoWindowResult> {
    const demoNumber = ++this.demoNumber;
    const result = await this.openWindow(this.createDemoUrl(demoNumber));

    return {
      id: result.id,
      reused: result.reused,
      replacedDemo: this.getDemoNumber(result.replacedUrl),
      stats: this.pool.getStats(),
    };
  }

  destroyAll(): WindowPoolStats {
    this.pool.destroyAll();
    return this.pool.getStats();
  }

  getStats(): WindowPoolStats {
    return this.pool.getStats();
  }

  private createDemoUrl(demoNumber: number): string {
    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src 'unsafe-inline'"
    >
    <title>演示窗口 ${demoNumber}</title>
    <style>
      body {
        display: grid;
        min-height: 100vh;
        margin: 0;
        place-items: center;
        color: #262626;
        background: #f5f5f5;
        font-family: system-ui, sans-serif;
      }
      main {
        padding: 40px;
        text-align: center;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgb(0 0 0 / 10%);
      }
      strong { color: #52c41a; font-size: 48px; }
    </style>
  </head>
  <body>
    <main>
      <p>WindowPool 演示窗口</p>
      <strong>#${demoNumber}</strong>
      <p>继续打开窗口，超过池容量后将复用最久未聚焦的窗口。</p>
    </main>
  </body>
</html>`;

    return `data:text/html;charset=UTF-8,${encodeURIComponent(html)}#demo=${demoNumber}`;
  }

  private getDemoNumber(url?: string): number | undefined {
    const match = url?.match(/#demo=(\d+)$/);
    return match ? Number(match[1]) : undefined;
  }
}
