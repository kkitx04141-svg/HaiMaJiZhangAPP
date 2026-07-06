/**
 * 支出数据管理 Hook
 *
 * 封装支出的增删查逻辑，让组件不直接操作数据库，
 * 而是通过这个 Hook 来管理数据和刷新 UI
 */

import { useState, useCallback } from 'react'
import {
  addExpense as dbAddExpense,
  getExpenses,
  deleteExpense as dbDeleteExpense,
  type ExpenseInput,
  type ExpenseRecord
} from '@/db/expenseRepo'

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(false)

  /** 刷新当前月份的记录列表（可选按类型筛选） */
  const refresh = useCallback(async (yearMonth: string, type?: ExpenseRecord['type']) => {
    setLoading(true)
    try {
      const data = await getExpenses(yearMonth, type)
      setExpenses(data)
    } catch (err) {
      console.error('获取记录列表失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 新增一笔支出（写入数据库，但不刷新列表，由调用方决定何时刷新） */
  const addExpense = useCallback(async (data: ExpenseInput): Promise<number> => {
    return dbAddExpense(data)
  }, [])

  /** 删除一笔支出（立即从本地 state 中移除，同时写入数据库） */
  const removeExpense = useCallback(async (id: number) => {
    await dbDeleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { expenses, loading, refresh, addExpense, removeExpense }
}
