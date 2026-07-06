import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import initSqlJs from 'sql.js'

// ---------- 数据库 ----------
let db: any = null
let dbPath: string

async function saveDatabase(): Promise<void> {
  if (!db) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    await writeFile(dbPath, buffer)
  } catch (error) {
    console.error('保存数据库失败:', error)
  }
}

async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()
  const userDataPath = app.getPath('userData')
  dbPath = join(userDataPath, 'heima-accounting.db')

  try {
    const fileBuffer = await readFile(dbPath)
    db = new SQL.Database(fileBuffer)
  } catch {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER NOT NULL,
      category_main TEXT NOT NULL,
      category_sub TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      type TEXT NOT NULL DEFAULT 'expense',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 迁移：旧表可能没有 type 列，尝试添加
  try {
    db.run(`ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'`)
  } catch {
    // 列已存在，忽略
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_month TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category_main TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(year_month, category_main)
    )
  `)

  await saveDatabase()
}

// ---------- IPC 处理器 ----------
function registerIpcHandlers(): void {
  ipcMain.handle('db:query', async (_event, sql: string, params?: unknown[]) => {
    try {
      if (params && params.length > 0) {
        const stmt = db.prepare(sql)
        stmt.bind(params as any[])
        const rows: unknown[] = []
        while (stmt.step()) {
          rows.push(stmt.getAsObject())
        }
        stmt.free()
        return rows
      }
      const results = db.exec(sql)
      if (results.length === 0) return []
      const { columns, values } = results[0]
      return values.map((row) => {
        const obj: Record<string, unknown> = {}
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i]
        })
        return obj
      })
    } catch (error) {
      console.error('数据库查询失败:', error)
      throw error
    }
  })

  ipcMain.handle('db:run', async (_event, sql: string, params?: unknown[]) => {
    try {
      db.run(sql, params)
      await saveDatabase()
      const changesResult = db.exec('SELECT changes() as changes, last_insert_rowid() as lastInsertRowid')
      const row = changesResult[0]?.values[0]
      return {
        changes: row ? Number(row[0]) : 0,
        lastInsertRowid: row ? Number(row[1]) : 0
      }
    } catch (error) {
      console.error('数据库写入失败:', error)
      throw error
    }
  })

  ipcMain.handle('dialog:save', async (_event, options) => {
    const result = await dialog.showSaveDialog(options)
    return {
      filePath: result.filePath,
      canceled: result.canceled
    }
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    await writeFile(filePath, content, 'utf-8')
  })
}

// ---------- 创建窗口 ----------
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: '黑马记账',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------- 应用启动 ----------
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.heima.accounting')
  }

  await initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', async () => {
  if (db) {
    await saveDatabase()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
