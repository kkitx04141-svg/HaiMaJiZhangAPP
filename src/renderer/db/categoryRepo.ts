/**
 * 分类数据操作层
 *
 * 与 expenseRepo / budgetRepo 模式一致，
 * 所有数据库操作通过 window.electronAPI 的 IPC 桥接进行。
 *
 * categories 表结构：
 * - id INTEGER PRIMARY KEY AUTOINCREMENT
 * - name TEXT NOT NULL               — 分类名称
 * - icon TEXT NOT NULL DEFAULT '💰'  — emoji 图标
 * - parent_id INTEGER                — NULL=一级分类，有值=二级小类
 * - type TEXT ('expense'|'income')   — 收支类型
 * - is_preset INTEGER (0|1)          — 1=预置（不可删除编辑）
 * - sort_order INTEGER               — 排序序号
 */

/** 数据库中的分类记录 */
export interface CategoryRecord {
  id: number
  name: string
  icon: string
  parent_id: number | null
  type: 'expense' | 'income'
  is_preset: number
  sort_order: number
  created_at: string
  updated_at: string
}

/** 新增分类时的输入数据 */
export interface CategoryInput {
  name: string
  icon: string
  parent_id: number | null
  type: 'expense' | 'income'
}

/**
 * 查询全部分类（按 type、sort_order 排序）
 */
export async function getAllCategories(): Promise<CategoryRecord[]> {
  return window.electronAPI.db.query(
    'SELECT * FROM categories ORDER BY type, sort_order'
  ) as Promise<CategoryRecord[]>
}

/**
 * 按收支类型筛选分类
 */
export async function getCategoriesByType(
  type: 'expense' | 'income'
): Promise<CategoryRecord[]> {
  return window.electronAPI.db.query(
    'SELECT * FROM categories WHERE type = ? ORDER BY sort_order',
    [type]
  ) as Promise<CategoryRecord[]>
}

/**
 * 新增一个分类（用户自建，is_preset=0）
 * sort_order 自动取同级最大值 + 1
 * @returns 新插入记录的 id
 */
export async function addCategory(data: CategoryInput): Promise<number> {
  // 查同级最大 sort_order
  const maxRows = await window.electronAPI.db.query(
    `SELECT COALESCE(MAX(sort_order), 0) as max_order
     FROM categories
     WHERE type = ? AND parent_id IS ?`,
    [data.type, data.parent_id]
  ) as Array<{ max_order: number }>
  const sortOrder = (maxRows[0]?.max_order ?? 0) + 1

  const result = await window.electronAPI.db.run(
    `INSERT INTO categories (name, icon, parent_id, type, is_preset, sort_order)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [data.name, data.icon, data.parent_id, data.type, sortOrder]
  )
  return result.lastInsertRowid
}

/**
 * 修改分类的名称、图标和父级归属（仅用户自建分类）
 * parent_id 传 null = 一级分类，传数字 = 归属到某个父级下
 */
export async function updateCategory(
  id: number,
  data: { name: string; icon: string; parent_id?: number | null }
): Promise<void> {
  // 如果改了 parent_id，重新计算 sort_order（放到新同级末尾）
  if (data.parent_id !== undefined) {
    const typeRows = await window.electronAPI.db.query(
      'SELECT type FROM categories WHERE id = ?',
      [id]
    ) as Array<{ type: string }>
    const catType = typeRows[0]?.type ?? 'expense'

    const maxRows = await window.electronAPI.db.query(
      `SELECT COALESCE(MAX(sort_order), 0) as max_order
       FROM categories
       WHERE type = ? AND parent_id IS ?`,
      [catType, data.parent_id]
    ) as Array<{ max_order: number }>
    const sortOrder = (maxRows[0]?.max_order ?? 0) + 1

    await window.electronAPI.db.run(
      `UPDATE categories
       SET name = ?, icon = ?, parent_id = ?, sort_order = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ? AND is_preset = 0`,
      [data.name, data.icon, data.parent_id, sortOrder, id]
    )
  } else {
    await window.electronAPI.db.run(
      `UPDATE categories
       SET name = ?, icon = ?, updated_at = datetime('now', 'localtime')
       WHERE id = ? AND is_preset = 0`,
      [data.name, data.icon, id]
    )
  }
}

/**
 * 删除一个分类（Repo 层不做权限校验，由 Hook 层负责）
 */
export async function deleteCategory(id: number): Promise<void> {
  await window.electronAPI.db.run('DELETE FROM categories WHERE id = ?', [id])
}

/**
 * 删除某个父级分类下的所有子分类
 */
export async function deleteSubCategories(parentId: number): Promise<void> {
  await window.electronAPI.db.run(
    'DELETE FROM categories WHERE parent_id = ?',
    [parentId]
  )
}

/**
 * 查询某分类在收支记录中被引用的次数
 * 对支出主分类：查 category_main 匹配
 * 对支出子分类：查 category_sub 匹配
 * 对收入分类：查 category_main 匹配
 */
export async function getCategoryUsageCount(
  name: string,
  type: 'expense' | 'income'
): Promise<number> {
  const rows = await window.electronAPI.db.query(
    `SELECT COUNT(*) as cnt FROM expenses
     WHERE type = ? AND (category_main = ? OR category_sub = ?)`,
    [type, name, name]
  ) as Array<{ cnt: number }>
  return rows[0]?.cnt ?? 0
}

/**
 * 将收支记录中引用旧分类名的字段改为新名称
 */
export async function updateExpenseCategoryRefs(
  oldName: string,
  newName: string,
  type: 'expense' | 'income'
): Promise<void> {
  await window.electronAPI.db.run(
    `UPDATE expenses SET category_main = ?, updated_at = datetime('now', 'localtime')
     WHERE type = ? AND category_main = ?`,
    [newName, type, oldName]
  )
  await window.electronAPI.db.run(
    `UPDATE expenses SET category_sub = ?, updated_at = datetime('now', 'localtime')
     WHERE type = ? AND category_sub = ?`,
    [newName, type, oldName]
  )
}
