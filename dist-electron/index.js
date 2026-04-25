//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let path = require("path");
path = __toESM(path);
let fs = require("fs");
fs = __toESM(fs);
//#region electron/main/index.ts
var isDev = process.env.NODE_ENV === "development";
function createWindow() {
	const win = new electron.BrowserWindow({
		width: 1e3,
		height: 800,
		webPreferences: {
			preload: path.default.join(__dirname, "../preload/index.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	if (isDev) {
		win.loadURL("http://localhost:5173");
		win.webContents.openDevTools();
	} else win.loadFile(path.default.join(__dirname, "dist/index.html"));
}
electron.app.whenReady().then(() => {
	createWindow();
	electron.app.on("activate", () => {
		if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") electron.app.quit();
});
var filePath = path.default.join(electron.app.getPath("userData"), "todo.json");
console.log("📁 Todo 文件路径:", filePath);
console.log("📂 userData 目录:", electron.app.getPath("userData"));
electron.ipcMain.handle("todo:get", () => {
	if (!fs.default.existsSync(filePath)) return [];
	return JSON.parse(fs.default.readFileSync(filePath, "utf-8"));
});
electron.ipcMain.handle("todo:set", (_, data) => {
	fs.default.writeFileSync(filePath, JSON.stringify(data));
	return true;
});
//#endregion
