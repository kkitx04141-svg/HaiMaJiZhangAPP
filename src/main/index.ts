import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import initSqlJs from 'sql.js'

// ---------- 数据库 ----------
// 通过 InstanceType 从 sql.js 的 Database 构造函数推导实例类型，避免使用 any
type SqlDatabase = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>
let db: SqlDatabase | null = null
let dbPath: string

async function saveDatabase(): Promise<void> {
  if (!db) return
  try {
    const data = db!.export()
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

  db!.run(`
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
    db!.run(`ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'`)
  } catch {
    // 列已存在，忽略
  }

  db!.run(`
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

  // ---------- 分类表 ----------
  db!.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '💰',
      parent_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      is_preset INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `)

  // 首次启动时插入预置分类种子数据
  const countResult = db!.exec("SELECT COUNT(*) as cnt FROM categories")
  const categoryCount = countResult[0]?.values[0]?.[0] ?? 0
  if (categoryCount === 0) {
    seedPresetCategories()
  }

  await saveDatabase()
}

// ---------- 预置分类种子数据 ----------
// 这些常量在首次启动时用于初始化 categories 表
// 修改预置分类时，请同步更新 src/renderer/constants/categories.ts

/** 预置支出分类（8 大类，41 小类） */
const EXPENSE_SEED_DATA: Array<{ name: string; icon: string; subs: Array<{ name: string; icon: string }> }> = [
  {
    name: '餐饮饮食', icon: '🍜',
    subs: [
      { name: '早餐', icon: '🥐' }, { name: '午餐', icon: '🍱' }, { name: '晚餐', icon: '🍲' },
      { name: '零食水果', icon: '🍎' }, { name: '聚餐请客', icon: '🥂' }, { name: '饮品咖啡', icon: '☕' },
    ],
  },
  {
    name: '交通出行', icon: '🚗',
    subs: [
      { name: '公共交通', icon: '🚌' }, { name: '打车网约车', icon: '🚕' }, { name: '加油充电', icon: '⛽' },
      { name: '停车过路费', icon: '🅿️' }, { name: '火车飞机', icon: '✈️' },
    ],
  },
  {
    name: '购物消费', icon: '🛒',
    subs: [
      { name: '服饰鞋包', icon: '👗' }, { name: '数码电器', icon: '📱' }, { name: '日用品', icon: '🧴' },
      { name: '家居装饰', icon: '🛋️' }, { name: '美妆护肤', icon: '💄' },
    ],
  },
  {
    name: '住房居住', icon: '🏠',
    subs: [
      { name: '房租', icon: '🔑' }, { name: '房贷', icon: '🏦' }, { name: '水电燃气', icon: '💡' },
      { name: '物业费', icon: '🏢' }, { name: '维修维护', icon: '🔧' }, { name: '网费话费', icon: '📶' },
    ],
  },
  {
    name: '健康医疗', icon: '💊',
    subs: [
      { name: '看病就医', icon: '🏥' }, { name: '药品', icon: '💉' }, { name: '体检保健', icon: '🩺' },
      { name: '牙科眼科', icon: '🦷' }, { name: '运动健身', icon: '🏃' },
    ],
  },
  {
    name: '文教娱乐', icon: '🎮',
    subs: [
      { name: '学习进修', icon: '📚' }, { name: '电影演出', icon: '🎬' }, { name: '游戏充值', icon: '🎮' },
      { name: '旅游度假', icon: '🏖️' }, { name: '宠物开销', icon: '🐾' }, { name: '兴趣爱好', icon: '🎨' },
    ],
  },
  {
    name: '人情社交', icon: '🎁',
    subs: [
      { name: '红包礼金', icon: '🧧' }, { name: '礼物赠送', icon: '🎀' }, { name: '孝敬长辈', icon: '👴' },
      { name: '慈善捐款', icon: '🤝' },
    ],
  },
  {
    name: '其他支出', icon: '📦',
    subs: [
      { name: '金融服务', icon: '💳' }, { name: '快递邮政', icon: '📮' }, { name: '税费', icon: '🧾' },
      { name: '其他杂项', icon: '❓' },
    ],
  },
]

/** 预置收入分类（5 个，扁平列表，无二级） */
const INCOME_SEED_DATA = [
  { name: '工资薪水', icon: '💰' },
  { name: '奖金红包', icon: '🎁' },
  { name: '投资理财', icon: '📈' },
  { name: '兼职副业', icon: '💼' },
  { name: '其他收入', icon: '📦' },
]

/** 首次启动时插入预置分类种子数据 */
function seedPresetCategories(): void {
  insertExpenseSeeds()
  insertIncomeSeeds()
}

/** 插入预置支出分类（含一级大类 + 二级小类的父子关系） */
function insertExpenseSeeds(): void {
  let sortOrder = 0
  for (const main of EXPENSE_SEED_DATA) {
    sortOrder++
    db!.run(
      `INSERT INTO categories (name, icon, parent_id, type, is_preset, sort_order) VALUES (?, ?, NULL, 'expense', 1, ?)`,
      [main.name, main.icon, sortOrder]
    )
    // 拿到刚插入的大类 id，作为子类的 parent_id
    const rowidResult = db!.exec('SELECT last_insert_rowid() as id')
    const parentId = Number(rowidResult[0]?.values[0]?.[0])

    let subOrder = 0
    for (const sub of main.subs) {
      subOrder++
      db!.run(
        `INSERT INTO categories (name, icon, parent_id, type, is_preset, sort_order) VALUES (?, ?, ?, 'expense', 1, ?)`,
        [sub.name, sub.icon, parentId, subOrder]
      )
    }
  }
}

/** 插入预置收入分类（扁平列表，无二级分类） */
function insertIncomeSeeds(): void {
  let sortOrder = 0
  for (const inc of INCOME_SEED_DATA) {
    sortOrder++
    db!.run(
      `INSERT INTO categories (name, icon, parent_id, type, is_preset, sort_order) VALUES (?, ?, NULL, 'income', 1, ?)`,
      [inc.name, inc.icon, sortOrder]
    )
  }
}

// ==================== IPC 处理器 ====================
// 注册 IPC 通信处理器 —— 让渲染进程（界面）能通过消息调用主进程的能力
// 每条 ipcMain.handle 对应 preload 脚本中暴露的一个 API
function registerIpcHandlers(): void {
  ipcMain.handle('db:query', async (_event, sql: string, params?: unknown[]) => {
    try {
      if (params && params.length > 0) {
        const stmt = db!.prepare(sql)
        stmt.bind(params as any[])
        const rows: unknown[] = []
        while (stmt.step()) {
          rows.push(stmt.getAsObject())
        }
        stmt.free()
        return rows
      }
      const results = db!.exec(sql)
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
      db!.run(sql, params)
      await saveDatabase()
      const changesResult = db!.exec('SELECT changes() as changes, last_insert_rowid() as lastInsertRowid')
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
      // 安全配置：隔离渲染进程，禁止直接访问 Node.js
      // 虽然 Electron 25 中默认值已是 true/false，但显式声明是最佳实践
      contextIsolation: true,
      nodeIntegration: false,
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
