/**
 * 统计数据管理 Hook
 *
 * 封装分类统计、月度趋势、收支摘要数据的获取逻辑。
 */

import { useState, useCallback } from 'react'
import {
  getCategoryStats,
  getMonthlyTrends,
  getMonthSummary,
  type CategoryStat,
  type MonthlyTrend,
} from '@/db/expenseRepo'

export interface MonthSummaryData {
  expense: number
  income: number
  balance: number
  count: number
  dailyAvg: number
}

export function useStatistics() {
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [monthSummary, setMonthSummary] = useState<MonthSummaryData>({
    expense: 0,
    income: 0,
    balance: 0,
    count: 0,
    dailyAvg: 0,
  })
  const [loading, setLoading] = useState(false)

  /** 刷新所有统计数据 */
  const refresh = useCallback(async (yearMonth: string) => {
    setLoading(true)
    try {
      const [stats, trends, summary] = await Promise.all([
        getCategoryStats(yearMonth),
        getMonthlyTrends(6),
        getMonthSummary(yearMonth),
      ])

      setCategoryStats(stats)
      // 趋势数据翻转为时间升序（方便柱状图从左到右展示）
      setMonthlyTrends(trends.reverse())
      setMonthSummary({
        expense: summary.expense,
        income: summary.income,
        balance: summary.income - summary.expense,
        count: summary.count,
        dailyAvg: summary.daysInMonth > 0
          ? Math.round(summary.expense / summary.daysInMonth)
          : 0,
      })
    } catch (err) {
      console.error('获取统计数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { categoryStats, monthlyTrends, monthSummary, loading, refresh }
}
