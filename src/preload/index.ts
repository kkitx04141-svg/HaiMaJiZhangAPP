import { contextBridge, ipcRenderer } from 'electron'

// ==================== 预加载脚本 ====================
//
// 这是 Electron 的安全边界。contextBridge（上下文桥接）是 Electron 的安全机制：
// 它在渲染进程（网页界面）和主进程（Node.js 系统能力）之间架一座"受控的桥"，
// 只暴露我们明确允许的 API，防止网页代码直接访问文件系统、系统命令等危险能力。
//
// 这里只暴露最少、最安全的 4 个 API：
//   1. platform       — 告知渲染进程当前操作系统
//   2. db.query/run   — 数据库读写（通过 IPC 消息转发到主进程执行）
//   3. showSaveDialog — 弹出系统"另存为"对话框
//   4. writeFile      — 写入文件到磁盘
//
// 遵循 Electron 安全最佳实践：永远不要在这里暴露 shell.openExternal、
// 直接的文件系统访问、或任意命令执行能力。

contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,

  // 数据库操作（通过 IPC 通信）
  db: {
    // 执行查询（SELECT）
    query: (sql: string, params?: unknown[]): Promise<unknown[]> => {
      return ipcRenderer.invoke('db:query', sql, params)
    },
    // 执行写入（INSERT/UPDATE/DELETE）
    run: (sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number }> => {
      return ipcRenderer.invoke('db:run', sql, params)
    }
  },

  // 文件对话框
  showSaveDialog: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => {
    return ipcRenderer.invoke('dialog:save', options)
  },

  // 文件写入
  writeFile: (filePath: string, content: string): Promise<void> => {
    return ipcRenderer.invoke('fs:writeFile', filePath, content)
  }
})
