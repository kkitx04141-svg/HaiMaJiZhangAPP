/**
 * 预算数据操作层 — 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('window', {
    electronAPI: {
      db: {
        query: vi.fn().mockResolvedValue([]),
        run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
      },
    },
  })
})

function db() {
  // @ts-expect-error window 是通过 stubGlobal 注入的
  return window.electronAPI.db
}

const repo = await import('@/db/budgetRepo')

// ============================================================
// saveBudget
// ============================================================

describe('saveBudget — 保存或更新预算', () => {
  it('总预算（categoryMain 不传）→ UPSERT 含 category_main = null', async () => {
    await repo.saveBudget('2026-07', 500000)

    const [sql, params] = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('INSERT INTO budgets')
    expect(sql).toContain('ON CONFLICT(year_month, category_main)')
    expect(params).toEqual(['2026-07', 500000, null])
  })

  it('分类预算 → UPSERT 含具体分类名', async () => {
    await repo.saveBudget('2026-07', 100000, '餐饮饮食')

    const [, params] = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(params).toEqual(['2026-07', 100000, '餐饮饮食'])
  })

  it('修改已有预算 → 依然走 UPSERT 路径', async () => {
    await repo.saveBudget('2026-06', 300000, '交通出行')

    const [sql] = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('DO UPDATE SET')
  })
})

// ============================================================
// getBudgets
// ============================================================

describe('getBudgets — 查询预算', () => {
  it('查询某月预算 → SELECT WHERE year_month = ?', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 1, year_month: '2026-07', amount: 500000, category_main: null },
    ])

    const records = await repo.getBudgets('2026-07')

    const [sql, params] = (db().query as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('WHERE year_month = ?')
    expect(sql).toContain('ORDER BY category_main IS NULL DESC')
    expect(params).toEqual(['2026-07'])
    expect(records).toHaveLength(1)
  })

  it('返回空数组 → 该月暂无预算', async () => {
    ;(db().query as ReturnType<typeof vi.fn>).mockResolvedValueOnce([])

    const records = await repo.getBudgets('2026-07')

    expect(records).toEqual([])
  })
})

// ============================================================
// deleteBudget
// ============================================================

describe('deleteBudget — 删除预算', () => {
  it('传入 id → DELETE WHERE id = ?', async () => {
    await repo.deleteBudget(3)

    const [sql, params] = (db().run as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(sql).toContain('DELETE FROM budgets WHERE id = ?')
    expect(params).toEqual([3])
  })
})
