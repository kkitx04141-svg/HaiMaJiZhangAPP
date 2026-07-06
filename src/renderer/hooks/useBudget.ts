/**
 * 预算数据管理 Hook
 *
 * 封装预算的读取、保存、删除逻辑。
 */

import { useState, useCallback } from 'react'
import {
  getBudgets,
  saveBudget as dbSaveBudget,
  deleteBudget as dbDeleteBudget,
  type BudgetRecord,
} from '@/db/budgetRepo'

export function useBudget() {
  const [budgets, setBudgets] = useState<BudgetRecord[]>([])
  const [loading, setLoading] = useState(false)

  /** 从记录列表中提取月度总预算（category_main 为 null 的那条） */
  const totalBudget = budgets.find((b) => b.category_main === null)?.amount ?? null

  /** 从记录列表中提取分类预算 Map */
  const categoryBudgets: Map<string, number> = new Map(
    budgets
      .filter((b) => b.category_main !== null)
      .map((b) => [b.category_main!, b.amount])
  )

  /** 刷新某月的预算数据 */
  const refresh = useCallback(async (yearMonth: string) => {
    setLoading(true)
    try {
      const data = await getBudgets(yearMonth)
      setBudgets(data)
    } catch (err) {
      console.error('获取预算数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 保存预算（写入数据库 + 刷新） */
  const saveBudget = useCallback(
    async (yearMonth: string, amount: number, categoryMain: string | null = null) => {
      await dbSaveBudget(yearMonth, amount, categoryMain)
      await refresh(yearMonth)
    },
    [refresh]
  )

  /** 删除预算（写入数据库 + 刷新） */
  const removeBudget = useCallback(
    async (id: number, yearMonth: string) => {
      await dbDeleteBudget(id)
      await refresh(yearMonth)
    },
    [refresh]
  )

  return { budgets, totalBudget, categoryBudgets, loading, refresh, saveBudget, removeBudget }
}
