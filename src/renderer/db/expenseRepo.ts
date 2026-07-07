/**
 * 支出数据操作层
 *
 * 所有数据库操作通过 window.electronAPI 的 IPC 桥接进行
 * 这里不直接操作数据库，而是调用主进程中注册的 db:query 和 db:run 处理函数
 */

/** 记录类型 */
export type RecordType = 'expense' | 'income'

/** 新增记录时的输入数据 */
export interface ExpenseInput {
  amount: number        // 金额，单位：分
  category_main: string  // 一级分类（收入时即收入分类名）
  category_sub: string   // 二级分类（收入时和 category_main 相同）
  date: string           // 日期，格式 YYYY-MM-DD
  note: string           // 备注
  type: RecordType       // 类型：支出或收入
}

/** 从数据库查询出的完整记录 */
export interface ExpenseRecord {
  id: number
  amount: number
  category_main: string
  category_sub: string
  date: string
  note: string
  type: RecordType
  created_at: string
  updated_at: string
}

/**
 * 新增一笔收支记录（支出或收入，由 data.type 决定）
 * @returns 新插入记录的 id
 */
export async function addExpense(data: ExpenseInput): Promise<number> {
  const result = await window.electronAPI.db.run(
    `INSERT INTO expenses (amount, category_main, category_sub, date, note, type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.amount, data.category_main, data.category_sub, data.date, data.note, data.type]
  )
  return result.lastInsertRowid
}

/**
 * 查询收支记录列表
 * @param yearMonth 可选，按月筛选，格式 "YYYY-MM"
 * @param type 可选，按类型筛选（'expense' 或 'income'）
 * @returns 按日期倒序排列的记录
 */
export async function getExpenses(
  yearMonth?: string,
  type?: RecordType
): Promise<ExpenseRecord[]> {
  let sql = 'SELECT * FROM expenses'
  const conditions: string[] = []
  const params: unknown[] = []

  if (yearMonth) {
    conditions.push("strftime('%Y-%m', date) = ?")
    params.push(yearMonth)
  }
  if (type) {
    conditions.push("type = ?")
    params.push(type)
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }

  sql += ' ORDER BY date DESC, created_at DESC'

  return window.electronAPI.db.query(sql, params) as Promise<ExpenseRecord[]>
}

/**
 * 删除一笔收支记录
 */
export async function deleteExpense(id: number): Promise<void> {
  await window.electronAPI.db.run('DELETE FROM expenses WHERE id = ?', [id])
}

/**
 * 根据 id 获取单条收支记录
 */
export async function getExpenseById(id: number): Promise<ExpenseRecord | null> {
  const rows = await window.electronAPI.db.query(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  ) as ExpenseRecord[]
  return rows.length > 0 ? rows[0] : null
}

// ---------- 统计查询 ----------

/** 分类统计结果 */
export interface CategoryStat {
  category_main: string
  total: number
}

/**
 * 获取当月各一级分类的汇总金额（仅支出）
 * @param yearMonth 格式 "YYYY-MM"
 */
export async function getCategoryStats(yearMonth: string): Promise<CategoryStat[]> {
  return window.electronAPI.db.query(
    `SELECT category_main, SUM(amount) as total
     FROM expenses
     WHERE strftime('%Y-%m', date) = ? AND type = 'expense'
     GROUP BY category_main
     ORDER BY total DESC`,
    [yearMonth]
  ) as Promise<CategoryStat[]>
}

/** 月度趋势结果 */
export interface MonthlyTrend {
  month: string
  expense: number
  income: number
}

/**
 * 获取最近 N 个月的月度收支趋势
 * @param monthCount 查询最近多少个月，默认 6
 */
export async function getMonthlyTrends(monthCount: number = 6): Promise<MonthlyTrend[]> {
  return window.electronAPI.db.query(
    `SELECT
       strftime('%Y-%m', date) as month,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
     FROM expenses
     GROUP BY month
     ORDER BY month DESC
     LIMIT ?`,
    [monthCount]
  ) as Promise<MonthlyTrend[]>
}

/**
 * 获取指定月份的收支汇总
 * @param yearMonth 格式 "YYYY-MM"
 */
export async function getMonthSummary(yearMonth: string): Promise<{
  expense: number
  income: number
  count: number
  daysInMonth: number
}> {
  const rows = await window.electronAPI.db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
       COUNT(*) as count
     FROM expenses
     WHERE strftime('%Y-%m', date) = ?`,
    [yearMonth]
  ) as Array<{ expense: number; income: number; count: number }>

  const { expense, income, count } = rows[0] || { expense: 0, income: 0, count: 0 }

  // 计算当月天数
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()

  return { expense, income, count, daysInMonth }
}
