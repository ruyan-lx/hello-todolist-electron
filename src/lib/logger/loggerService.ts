import log from 'electron-log/main';

/**
 * 初始化日志系统，在 app.ready 之前调用
 */
export function initLogger() {
    // 让 electron-log 注册 IPC 监听，接收渲染进程日志
    log.initialize();

    // ====== 文件日志配置 ======
    log.transports.file.level = 'info';
    log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB 轮转
    log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';

    // 自定义日志文件名
    log.transports.file.fileName = 'main.log';

    // ====== 控制台日志配置 ======
    log.transports.console.level = 'debug';
    log.transports.console.format = '[{level}] {text}';

    // ====== 捕获全局未处理异常 ======
    log.errorHandler.startCatching({
        showDialog: false,
    });

    return log;
}

/**
 * 获取主进程 logger 实例
 */
export function getLogger(scope = 'Main') {
    return log.scope(scope);
}

export default log;