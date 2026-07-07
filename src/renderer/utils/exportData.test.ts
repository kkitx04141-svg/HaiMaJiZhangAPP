/**
 * 数据导出工具 — 单元测试
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recordsToCsv } from '@/utils/exportData'
import type { ExpenseRecord } from '@/db/expenseRepo'

// ---------- 辅助函数：构造测试用记录 ----------

function makeRecord(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: 1,
    amount: 2550,
    category_main: '餐饮饮食',
    category_sub: '日常用餐',
    date: '2026-07-01',
    note: '',
    type: 'expense',
    created_at: '2026-07-01 10:00:00',
    updated_at: '2026-07-01 10:00:00',
    ...overrides,
  }
}

// ============================================================
// recordsToCsv — 纯函数测试
// ============================================================

describe('recordsToCsv — 记录列表转 CSV 字符串', () => {
  it('空数组 → 只有表头行', () => {
    const result = recordsToCsv([])
    expect(result).toBe('﻿日期,类型,一级分类,二级分类,金额(元),备注')
  })

  it('单条支出记录 → 表头 + 一行数据', () => {
    const result = recordsToCsv([
      makeRecord({
        amount: 2550,
        category_main: '餐饮饮食',
        category_sub: '日常用餐',
        date: '2026-07-01',
        note: '',
        type: 'expense',
      }),
    ])
    expect(result).toBe(
      '﻿日期,类型,一级分类,二级分类,金额(元),备注\n' +
      '2026-07-01,支出,餐饮饮食,日常用餐,25.50,'
    )
  })

  it('单条收入记录 → 类型列为"收入"', () => {
    const result = recordsToCsv([
      makeRecord({
        amount: 500000,
        category_main: '工资薪水',
        category_sub: '工资薪水',
        date: '2026-07-01',
        type: 'income',
      }),
    ])
    expect(result).toContain('2026-07-01,收入,工资薪水,工资薪水,5000.00,')
  })

  it('多条记录 → 按顺序排列', () => {
    const result = recordsToCsv([
      makeRecord({ id: 1, date: '2026-07-01', category_main: '餐饮' }),
      makeRecord({ id: 2, date: '2026-07-02', category_main: '交通' }),
    ])
    const lines = result.split('\n')
    expect(lines.length).toBe(3) // header + 2 rows
    expect(lines[1]).toContain('餐饮')
    expect(lines[2]).toContain('交通')
  })

  it('备注含逗号 → 用双引号包裹', () => {
    const result = recordsToCsv([
      makeRecord({ note: '牛奶,面包,鸡蛋' }),
    ])
    expect(result).toContain('"牛奶,面包,鸡蛋"')
  })

  it('备注含双引号 → 双引号转义为两个双引号', () => {
    const result = recordsToCsv([
      makeRecord({ note: '他说"你好"' }),
    ])
    // CSV 转义：字段用双引号包裹，内部的双引号加倍
    expect(result).toContain('"他说""你好"""')
  })

  it('备注同时含逗号和双引号 → 正确转义', () => {
    const result = recordsToCsv([
      makeRecord({ note: '买了"苹果",香蕉' }),
    ])
    expect(result).toContain('"买了""苹果"",香蕉"')
  })

  it('分类名含逗号 → 用双引号包裹', () => {
    const result = recordsToCsv([
      makeRecord({ category_main: 'A,B', category_sub: 'C' }),
    ])
    expect(result).toContain('"A,B"')
  })

  it('金额正确转换（分→元）', () => {
    const result = recordsToCsv([makeRecord({ amount: 1 })])
    expect(result).toContain(',0.01,')
  })

  it('BOM 头存在 — 确保 Excel 正确识别 UTF-8', () => {
    const result = recordsToCsv([])
    expect(result.charCodeAt(0)).toBe(0xfeff) // BOM (ZERO WIDTH NO-BREAK SPACE)
  })
})

// ============================================================
// exportDataAsCsv — IPC 交互测试（mock）
// ============================================================

// 不在此测试 exportDataAsCsv，原因：
// 1. 依赖 getExpenses（数据库查询）→ 需要 mock 复杂链路
// 2. 依赖 window.electronAPI.showSaveDialog / writeFile → 需要 mock IPC
// 3. 核心逻辑（CSV 生成）已通过 recordsToCsv 覆盖
// 如果后续需要，可以用 vi.mock 来 mock 整个 expenseRepo 和 electronAPI 再测
