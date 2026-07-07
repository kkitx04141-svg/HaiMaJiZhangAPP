/**
 * 日期格式化工具 — 单元测试
 */
import { describe, it, expect } from 'vitest'
import { getToday, getCurrentMonth, getDateLabel, formatMonth } from '@/utils/formatDate'

describe('getToday — 获取今天日期', () => {
  it('返回格式为 YYYY-MM-DD', () => {
    const result = getToday()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('返回的年份是 2026 年', () => {
    expect(getToday().startsWith('2026')).toBe(true)
  })
})

describe('getCurrentMonth — 获取当前月份', () => {
  it('返回格式为 YYYY-MM', () => {
    const result = getCurrentMonth()
    expect(result).toMatch(/^\d{4}-\d{2}$/)
  })

  it('返回的年份是 2026 年', () => {
    expect(getCurrentMonth().startsWith('2026')).toBe(true)
  })
})

describe('getDateLabel — 友好日期显示', () => {
  it('今天的日期 → 返回"今天"', () => {
    const today = getToday()
    expect(getDateLabel(today)).toBe('今天')
  })

  it('非今天的日期 → 返回"X月X日"格式', () => {
    // 用固定日期测试，避免依赖今天的实际日期
    expect(getDateLabel('2026-07-04')).toBe('7月4日')
  })

  it('另一个日期 → "X月X日"格式', () => {
    expect(getDateLabel('2026-12-31')).toBe('12月31日')
  })
})

describe('formatMonth — 格式化月份', () => {
  it('2026-07 → "2026年7月"', () => {
    expect(formatMonth('2026-07')).toBe('2026年7月')
  })

  it('2026-01 → "2026年1月"（去掉前导零）', () => {
    expect(formatMonth('2026-01')).toBe('2026年1月')
  })

  it('2026-12 → "2026年12月"', () => {
    expect(formatMonth('2026-12')).toBe('2026年12月')
  })
})
