/**
 * 金额格式化工具 — 单元测试
 */
import { describe, it, expect } from 'vitest'
import { centsToYuan, yuanToCents } from '@/utils/formatMoney'

describe('centsToYuan — 分转元（显示）', () => {
  it('正整数分 → 元（2550 → "25.50"）', () => {
    expect(centsToYuan(2550)).toBe('25.50')
  })

  it('零分 → "0.00"', () => {
    expect(centsToYuan(0)).toBe('0.00')
  })

  it('1分 → "0.01"', () => {
    expect(centsToYuan(1)).toBe('0.01')
  })

  it('100分 → "1.00"', () => {
    expect(centsToYuan(100)).toBe('1.00')
  })

  it('9999分 → "99.99"', () => {
    expect(centsToYuan(9999)).toBe('99.99')
  })

  it('负数分 → "-10.00"', () => {
    expect(centsToYuan(-1000)).toBe('-10.00')
  })
})

describe('yuanToCents — 元转分（存储）', () => {
  it('25.50元 → 2550分', () => {
    expect(yuanToCents(25.50)).toBe(2550)
  })

  it('0元 → 0分', () => {
    expect(yuanToCents(0)).toBe(0)
  })

  it('0.01元 → 1分', () => {
    expect(yuanToCents(0.01)).toBe(1)
  })

  it('99.99元 → 9999分', () => {
    expect(yuanToCents(99.99)).toBe(9999)
  })

  it('浮点数精度测试：0.1 + 0.2 = 0.3元 → 30分', () => {
    // 这就是为什么要用分存储的原因：0.1 + 0.2 在 JS 里是 0.30000000000000004
    expect(yuanToCents(0.1 + 0.2)).toBe(30)
  })

  it('负数 -10.00元 → -1000分', () => {
    expect(yuanToCents(-10.00)).toBe(-1000)
  })
})
