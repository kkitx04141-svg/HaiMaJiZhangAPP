import { contextBridge, ipcRenderer } from 'electron'

// ---------- 通过 contextBridge 把 Electron API 暴露给渲染进程 ----------
// 这里只暴露最少、最安全的 API，遵循 Electron 安全最佳实践

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
