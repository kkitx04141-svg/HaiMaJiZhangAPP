/**
 * 预算数据操作层
 *
 * budgets 表结构：
 * - year_month TEXT NOT NULL    — 月份 "YYYY-MM"
 * - amount INTEGER NOT NULL     — 预算金额（分）
 * - category_main TEXT          — 分类名（NULL = 月度总预算）
 * - UNIQUE(year_month, category_main)
 */

/** 预算记录 */
export interface BudgetRecord {
  id: number
  year_month: string
  amount: number
  category_main: string | null
  created_at: string
  updated_at: string
}

/**
 * 保存或更新一条预算（UPSERT）
 * @param yearMonth 月份 "YYYY-MM"
 * @param amount 预算金额（分）
 * @param categoryMain 分类名，null 表示总预算
 */
export async function saveBudget(
  yearMonth: string,
  amount: number,
  categoryMain: string | null = null
): Promise<void> {
  await window.electronAPI.db.run(
    `INSERT INTO budgets (year_month, amount, category_main)
     VALUES (?, ?, ?)
     ON CONFLICT(year_month, category_main) DO UPDATE SET
       amount = excluded.amount,
       updated_at = datetime('now', 'localtime')`,
    [yearMonth, amount, categoryMain]
  )
}

/**
 * 获取某月所有预算记录
 * @param yearMonth 月份 "YYYY-MM"
 */
export async function getBudgets(yearMonth: string): Promise<BudgetRecord[]> {
  return window.electronAPI.db.query(
    'SELECT * FROM budgets WHERE year_month = ? ORDER BY category_main IS NULL DESC',
    [yearMonth]
  ) as Promise<BudgetRecord[]>
}

/**
 * 删除一条预算
 */
export async function deleteBudget(id: number): Promise<void> {
  await window.electronAPI.db.run('DELETE FROM budgets WHERE id = ?', [id])
}
