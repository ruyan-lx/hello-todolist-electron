import {
  BrowserWindow,
  type BrowserWindowConstructorOptions,
} from "electron";

type WindowStatus = "idle" | "loading" | "active";

interface WindowItem {
  id: number;
  window: BrowserWindow;
  status: WindowStatus;
  url?: string;
  lastUsedTime: number;
  loading?: Promise<void>;
}

interface AcquiredWindow {
  item: WindowItem;
  reused: boolean;
}

export interface OpenWindowResult {
  id: number;
  reused: boolean;
  replacedUrl?: string;
}

export interface WindowPoolStats {
  maxSize: number;
  total: number;
  idle: number;
  loading: number;
  active: number;
}

export class WindowPool {
  private readonly windows = new Map<number, WindowItem>();
  private nextId = 1;

  constructor(
    private readonly maxSize = 5,
    private readonly windowOptions: BrowserWindowConstructorOptions = {},
  ) {
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new RangeError("窗口池大小必须是大于 0 的整数");
    }
  }

  async open(url: string): Promise<OpenWindowResult> {
    const acquired = this.acquireWindow();
    const { item, reused } =
      acquired instanceof Promise ? await acquired : acquired;
    const replacedUrl = item.url;

    item.window.hide();

    const loading = item.window.loadURL(url);
    item.loading = loading;

    try {
      await loading;
      item.status = "active";
      item.url = url;
      item.lastUsedTime = Date.now();
      item.window.show();
      item.window.focus();

      return { id: item.id, reused, replacedUrl };
    } catch (error) {
      if (!item.window.isDestroyed()) {
        item.status = "idle";
        item.url = undefined;
      }
      throw error;
    } finally {
      item.loading = undefined;
    }
  }

  destroyAll(): void {
    for (const item of this.windows.values()) {
      if (!item.window.isDestroyed()) {
        item.window.destroy();
      }
    }
    this.windows.clear();
  }

  getStats(): WindowPoolStats {
    const items = [...this.windows.values()].filter(
      ({ window }) => !window.isDestroyed(),
    );

    return {
      maxSize: this.maxSize,
      total: items.length,
      idle: items.filter(({ status }) => status === "idle").length,
      loading: items.filter(({ status }) => status === "loading").length,
      active: items.filter(({ status }) => status === "active").length,
    };
  }

  private acquireWindow(): AcquiredWindow | Promise<AcquiredWindow> {
    this.removeDestroyedWindows();

    const idle = [...this.windows.values()].find(
      ({ status }) => status === "idle",
    );
    if (idle) {
      idle.status = "loading";
      return { item: idle, reused: false };
    }

    if (this.windows.size < this.maxSize) {
      const item = this.createWindow();
      item.status = "loading";
      return { item, reused: false };
    }

    const lru = [...this.windows.values()]
      .filter(({ status }) => status === "active")
      .sort((a, b) => a.lastUsedTime - b.lastUsedTime)[0];
    if (lru) {
      lru.status = "loading";
      return { item: lru, reused: true };
    }

    const loading = [...this.windows.values()]
      .map((item) => item.loading)
      .filter((task): task is Promise<void> => Boolean(task));
    return Promise.race(loading.map((task) => task.catch(() => undefined))).then(
      () => this.acquireWindow(),
    );
  }

  private createWindow(): WindowItem {
    const id = this.nextId++;
    const window = new BrowserWindow({
      width: 900,
      height: 600,
      show: false,
      ...this.windowOptions,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        ...this.windowOptions.webPreferences,
      },
    });
    const item: WindowItem = {
      id,
      window,
      status: "idle",
      lastUsedTime: Date.now(),
    };

    this.windows.set(id, item);
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.on("focus", () => {
      item.lastUsedTime = Date.now();
    });
    window.once("closed", () => {
      this.windows.delete(id);
    });

    return item;
  }

  private removeDestroyedWindows(): void {
    for (const [id, item] of this.windows) {
      if (item.window.isDestroyed()) {
        this.windows.delete(id);
      }
    }
  }
}
