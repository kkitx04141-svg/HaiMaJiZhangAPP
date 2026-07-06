/// <reference types="vite/client" />

// 声明 electronAPI 的类型，与 electron/preload.ts 中暴露的 API 保持一致
interface ElectronAPI {
  platform: NodeJS.Platform
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>
    run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>
  }
  showSaveDialog: (options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ filePath?: string; canceled: boolean }>
  writeFile: (filePath: string, content: string) => Promise<void>
}

interface Window {
  electronAPI: ElectronAPI
}
