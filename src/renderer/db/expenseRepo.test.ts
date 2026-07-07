/**
 * 支出数据操作层 — 单元测试
 *
 * 测试策略：mock window.electronAPI.db 的行为，验证：
 * 1. SQL 语句结构正确
 * 2. 参数传递正确
 * 3. 返回值处理正确
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------- 全局 mock ----------

// 测试环境是 Node，没有浏览器的 window 全局变量
// vi.stubGlobal 向全局作用域注入一个假的 window 对象
beforeEach(() => {
  vi.stubGlobal('window', {
    electronAPI: {
      db: {
        query: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 42 }),
      },
    },
  })
})

// ---------- 类型安全的 mock helper ----------

function db() {
  // @ts-expect-error window 是通过 stubGlobal 注入的
  return window.electronAPI.db
}

// 在 beforeEach 之后动态导入，确保 mock 先生效
const repo = await import('@/db/expenseRepo')

// ============================================================
// addExpense
// ============================================================

describe('addExpense — 新增记录', () => {
  it('传入完整字段 → 调用 INSERT 并返回新 id', async () => {
    const id = await repo.addExpense({
      amount: 2550,
      category_main: '餐饮饮食',
      category_sub: '日常用餐',
      date: '2026-07-01',
      note: '午餐',
      type: 'expense',
    })

    const callArgs = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[0]).toContain('INSERT INTO expenses')
    expect(callArgs[1]).toEqual([2550, '餐饮饮食', '日常用餐', '2026-07-01', '午餐', 'expense'])
    expect(id).toBe(42)
  })

  it('收入类型 → INSERT 含 type=income', async () => {
    await repo.addExpense({
      amount: 500000,
      category_main: '工资薪水',
      category_sub: '工资薪水',
      date: '2026-07-01',
      note: '',
      type: 'income',
    })

    const callArgs = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(callArgs[1][5]).toBe('income')
  })
})

// ============================================================
// getExpenses
// ============================================================

describe('getExpenses — 查询记录列表', () => {
  it('无参数 → 查询全部（无 WHERE 子句）', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 1, amount: 100, category_main: '餐饮', category_sub: '午餐', date: '2026-07-01', note: '', type: 'expense', created_at: '', updated_at: '' },
    ])

    const records = await repo.getExpenses()

    const sql: string = (db().query as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(sql).toContain('SELECT * FROM expenses')
    expect(sql).not.toContain('WHERE')
    expect(records).toHaveLength(1)
  })

  it('只传 yearMonth → SQL 含 strftime 过滤', async () => {
    await repo.getExpenses('2026-07')

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain("strftime('%Y-%m', date) = ?")
    expect(params).toEqual(['2026-07'])
  })

  it('只传 type → SQL 含 type 过滤', async () => {
    await repo.getExpenses(undefined, 'expense')

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('type = ?')
    expect(params).toEqual(['expense'])
  })

  it('同时传 yearMonth + type → SQL 含两个条件', async () => {
    await repo.getExpenses('2026-07', 'expense')

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('WHERE')
    expect(sql).toContain('AND')
    expect(params).toEqual(['2026-07', 'expense'])
  })

  it('结果按 date DESC, created_at DESC 排序', async () => {
    await repo.getExpenses()

    const sql: string = (db().query as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(sql).toContain('ORDER BY date DESC, created_at DESC')
  })
})

// ============================================================
// deleteExpense
// ============================================================

describe('deleteExpense — 删除记录', () => {
  it('传入 id → 执行 DELETE WHERE id = ?', async () => {
    await repo.deleteExpense(5)

    const [sql, params] = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('DELETE FROM expenses WHERE id = ?')
    expect(params).toEqual([5])
  })
})

// ============================================================
// getExpenseById
// ============================================================

describe('getExpenseById — 按 ID 查询单条', () => {
  it('找到记录 → 返回记录对象', async () => {
    const mockRecord = { id: 10, amount: 100, date: '2026-07-01', type: 'expense' }
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockRecord])

    const result = await repo.getExpenseById(10)

    expect(result).toEqual(mockRecord)
    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('WHERE id = ?')
    expect(params).toEqual([10])
  })

  it('未找到 → 返回 null', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

    const result = await repo.getExpenseById(999)

    expect(result).toBeNull()
  })
})

// ============================================================
// getCategoryStats
// ============================================================

describe('getCategoryStats — 分类汇总', () => {
  it('查询当月支出分类汇总 → 包含 GROUP BY 和 type 过滤', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { category_main: '餐饮饮食', total: 5000 },
    ])

    const stats = await repo.getCategoryStats('2026-07')

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('GROUP BY category_main')
    expect(sql).toContain("type = 'expense'")
    expect(sql).toContain("strftime('%Y-%m', date) = ?")
    expect(params).toEqual(['2026-07'])
    expect(stats[0].total).toBe(5000)
  })
})

// ============================================================
// getMonthlyTrends
// ============================================================

describe('getMonthlyTrends — 月度趋势', () => {
  it('默认 6 个月 → LIMIT 6', async () => {
    await repo.getMonthlyTrends()

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('LIMIT ?')
    expect(params).toEqual([6])
  })

  it('指定 12 个月 → LIMIT 12', async () => {
    await repo.getMonthlyTrends(12)

    const [, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(params).toEqual([12])
  })
})

// ============================================================
// getMonthSummary
// ============================================================

describe('getMonthSummary — 月度汇总', () => {
  it('有数据 → 返回 expense/income/count/daysInMonth', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { expense: 5000, income: 100000, count: 10 },
    ])

    const summary = await repo.getMonthSummary('2026-07')

    const [, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(params).toEqual(['2026-07'])
    expect(summary).toEqual({ expense: 5000, income: 100000, count: 10, daysInMonth: 31 })
  })

  it('无数据 → 全部为 0，daysInMonth 仍正确', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

    const summary = await repo.getMonthSummary('2026-02')

    expect(summary.expense).toBe(0)
    expect(summary.income).toBe(0)
    expect(summary.count).toBe(0)
    expect(summary.daysInMonth).toBe(28)
  })

  it('7 月有 31 天', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])
    const s = await repo.getMonthSummary('2026-07')
    expect(s.daysInMonth).toBe(31)
  })

  it('12 月有 31 天', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])
    const s = await repo.getMonthSummary('2026-12')
    expect(s.daysInMonth).toBe(31)
  })
})
