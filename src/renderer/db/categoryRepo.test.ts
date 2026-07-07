/**
 * 分类数据操作层 — 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('window', {
    electronAPI: {
      db: {
        query: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 100 }),
      },
    },
  })
})

function db() {
  // @ts-expect-error window 是通过 stubGlobal 注入的
  return window.electronAPI.db
}

const fn = () => db().query as ReturnType<typeof vi.fn>
const rn = () => db().run as ReturnType<typeof vi.fn>

const repo = await import('@/db/categoryRepo')

// ============================================================
// getAllCategories
// ============================================================

describe('getAllCategories — 查询全部分类', () => {
  it('返回全部分类 → 按 type + sort_order 排序', async () => {
    fn().mockResolvedValueOnce([
      { id: 1, name: '餐饮饮食', type: 'expense', sort_order: 1 },
      { id: 2, name: '工资薪水', type: 'income', sort_order: 1 },
    ])

    const cats = await repo.getAllCategories()

    const sql = fn().mock.calls[0][0] as string
    expect(sql).toContain('ORDER BY type, sort_order')
    expect(cats).toHaveLength(2)
  })
})

// ============================================================
// getCategoriesByType
// ============================================================

describe('getCategoriesByType — 按类型筛选', () => {
  it('type=expense → 只返回支出分类', async () => {
    fn().mockResolvedValueOnce([{ id: 1, name: '餐饮饮食' }])

    await repo.getCategoriesByType('expense')

    const [sql, params] = fn().mock.calls[0]
    expect(sql).toContain('WHERE type = ?')
    expect(params).toEqual(['expense'])
  })

  it('type=income → 只返回收入分类', async () => {
    await repo.getCategoriesByType('income')

    const [, params] = fn().mock.calls[0]
    expect(params).toEqual(['income'])
  })
})

// ============================================================
// addCategory
// ============================================================

describe('addCategory — 新增分类', () => {
  it('新增一级支出分类 → sort_order = MAX(sort_order) + 1', async () => {
    fn().mockResolvedValueOnce([{ max_order: 5 }])
    rn().mockResolvedValueOnce({ changes: 1, lastInsertRowid: 100 })

    const id = await repo.addCategory({
      name: '自定义分类',
      icon: '🎯',
      parent_id: null,
      type: 'expense',
    })

    const [maxSql, maxParams] = fn().mock.calls[0]
    expect(maxSql).toContain('MAX(sort_order)')
    expect(maxParams).toEqual(['expense', null])

    const [insertSql, insertParams] = rn().mock.calls[0]
    expect(insertSql).toContain('INSERT INTO categories')
    expect(insertParams[2]).toBeNull() // parent_id = null（一级分类）
    expect(insertParams[4]).toBe(6)    // sort_order = 5 + 1

    expect(id).toBe(100)
  })

  it('同级无现有分类 → sort_order 从 1 开始', async () => {
    fn().mockResolvedValueOnce([{ max_order: 0 }])

    await repo.addCategory({
      name: '首个分类',
      icon: '🏷️',
      parent_id: null,
      type: 'expense',
    })

    const [, insertParams] = rn().mock.calls[0]
    expect(insertParams[4]).toBe(1)
  })
})

// ============================================================
// updateCategory
// ============================================================

describe('updateCategory — 修改分类', () => {
  it('不改 parent_id → 只更新 name + icon', async () => {
    await repo.updateCategory(5, { name: '改名后', icon: '🏷️' })

    const [sql, params] = rn().mock.calls[0]
    expect(sql).toContain('UPDATE categories')
    expect(sql).toContain('is_preset = 0')
    expect(sql).not.toContain('parent_id')
    expect(sql).not.toContain('sort_order')
    expect(params).toEqual(['改名后', '🏷️', 5])
  })

  it('改了 parent_id → 需要查 type + 算新 sort_order + 更新', async () => {
    fn().mockResolvedValueOnce([{ type: 'expense' }])
    fn().mockResolvedValueOnce([{ max_order: 3 }])
    rn().mockResolvedValueOnce({ changes: 1, lastInsertRowid: 5 })

    await repo.updateCategory(5, { name: '改名', icon: '🏷️', parent_id: 2 })

    // 第一步：查 type
    expect(fn().mock.calls[0][0]).toContain('SELECT type FROM categories WHERE id = ?')
    expect(fn().mock.calls[0][1]).toEqual([5])

    // 第二步：查 max_order
    expect(fn().mock.calls[1][0]).toContain('MAX(sort_order)')
    expect(fn().mock.calls[1][1]).toEqual(['expense', 2])

    // 第三步：UPDATE 含 parent_id 和 sort_order
    const [updateSql, updateParams] = rn().mock.calls[0]
    expect(updateSql).toContain('parent_id')
    expect(updateSql).toContain('sort_order')
    expect(updateParams).toEqual(['改名', '🏷️', 2, 4, 5])
  })

  it('parent_id 传 null → 把分类改为一级', async () => {
    fn().mockResolvedValueOnce([{ type: 'income' }])
    fn().mockResolvedValueOnce([{ max_order: 2 }])

    await repo.updateCategory(5, { name: '改名', icon: '🏷️', parent_id: null })

    const [, updateParams] = rn().mock.calls[0]
    expect(updateParams[2]).toBeNull()  // parent_id = null
    expect(updateParams[3]).toBe(3)     // sort_order = 2 + 1
  })
})

// ============================================================
// deleteCategory
// ============================================================

describe('deleteCategory — 删除分类', () => {
  it('传入 id → DELETE FROM categories WHERE id = ?', async () => {
    await repo.deleteCategory(10)

    const [sql, params] = rn().mock.calls[0]
    expect(sql).toContain('DELETE FROM categories WHERE id = ?')
    expect(params).toEqual([10])
  })
})

// ============================================================
// deleteSubCategories
// ============================================================

describe('deleteSubCategories — 删除子分类', () => {
  it('传入 parentId → DELETE WHERE parent_id = ?', async () => {
    await repo.deleteSubCategories(5)

    const [sql, params] = rn().mock.calls[0]
    expect(sql).toContain('DELETE FROM categories WHERE parent_id = ?')
    expect(params).toEqual([5])
  })
})

// ============================================================
// getCategoryUsageCount
// ============================================================

describe('getCategoryUsageCount — 查询引用次数', () => {
  it('有引用 → 返回计数值', async () => {
    fn().mockResolvedValueOnce([{ cnt: 5 }])

    const count = await repo.getCategoryUsageCount('餐饮饮食', 'expense')

    const [sql, params] = fn().mock.calls[0]
    expect(sql).toContain('COUNT(*)')
    expect(sql).toContain('expenses')
    expect(sql).toContain('category_main = ? OR category_sub = ?')
    expect(params).toEqual(['expense', '餐饮饮食', '餐饮饮食'])
    expect(count).toBe(5)
  })

  it('无引用 → 返回 0', async () => {
    fn().mockResolvedValueOnce([])

    const count = await repo.getCategoryUsageCount('不存在的分类', 'expense')

    expect(count).toBe(0)
  })
})

// ============================================================
// updateExpenseCategoryRefs
// ============================================================

describe('updateExpenseCategoryRefs — 更新引用分类名', () => {
  it('更新支出分类 → 同时更新 category_main 和 category_sub', async () => {
    await repo.updateExpenseCategoryRefs('旧名', '新名', 'expense')

    expect(rn()).toHaveBeenCalledTimes(2)

    expect(rn().mock.calls[0][0]).toContain('category_main')
    expect(rn().mock.calls[0][1]).toEqual(['新名', 'expense', '旧名'])

    expect(rn().mock.calls[1][0]).toContain('category_sub')
    expect(rn().mock.calls[1][1]).toEqual(['新名', 'expense', '旧名'])
  })
})
