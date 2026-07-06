/**
 * 首页 —— 记账页
 *
 * 页面结构（从上到下）：
 * - 月份选择器：左右箭头切换月份
 * - 预算进度条：仅在有总预算且非"只看收入"时显示
 * - 类型筛选标签：全部 / 支出 / 收入
 * - 账单列表：按日期分组显示收支记录
 * - 右下角浮动按钮（FAB）：点击弹出记账表单
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import Modal from '@/components/Modal'
import ExpenseForm from '@/components/ExpenseForm'
import ExpenseList from '@/components/ExpenseList'
import { useExpenses } from '@/hooks/useExpenses'
import { useBudget } from '@/hooks/useBudget'
import { getCurrentMonth, formatMonth } from '@/utils/formatDate'
import { centsToYuan } from '@/utils/formatMoney'
import type { RecordType } from '@/db/expenseRepo'

type FilterType = 'all' | 'expense' | 'income'

const FILTER_OPTIONS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

export default function HomePage() {
  const { expenses, loading, refresh, addExpense, removeExpense } = useExpenses()
  const { totalBudget, refresh: refreshBudget } = useBudget()

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState<FilterType>('all')

  // 当月总支出（只算 type='expense' 的记录）
  const spent = useMemo(
    () => expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  // 月份切换
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      if (m === 1) return `${y - 1}-12`
      return `${y}-${String(m - 1).padStart(2, '0')}`
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      if (m === 12) return `${y + 1}-01`
      return `${y}-${String(m + 1).padStart(2, '0')}`
    })
  }, [])

  // 月份或筛选类型变化时刷新
  useEffect(() => {
    refresh(currentMonth, filterType === 'all' ? undefined : filterType)
    refreshBudget(currentMonth)
  }, [currentMonth, filterType, refresh, refreshBudget])

  // 保存新记录
  const handleSave = async (data: {
    amount: number
    category_main: string
    category_sub: string
    date: string
    note: string
    type: RecordType
  }) => {
    await addExpense(data)
    setShowForm(false)
    const expenseMonth = data.date.slice(0, 7)
    if (expenseMonth === currentMonth) {
      refresh(currentMonth, filterType === 'all' ? undefined : filterType)
      refreshBudget(currentMonth)
    }
  }

  // 筛选标签切换
  const handleFilterChange = (key: FilterType) => {
    setFilterType(key)
  }

  const canGoNext = currentMonth < getCurrentMonth()

  return (
    <div className="flex flex-col h-full">
      {/* 月份选择器 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button
          onClick={goToPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          ◂
        </button>
        <span className="text-sm font-medium text-gray-700">
          {formatMonth(currentMonth)}
        </span>
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors
            ${canGoNext
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              : 'text-gray-200 cursor-not-allowed'
            }`}
        >
          ▸
        </button>
      </div>

      {/* 预算进度条（仅在有总预算且不是只看收入时显示） */}
      {totalBudget !== null && totalBudget > 0 && filterType !== 'income' && (
        <BudgetBar spent={spent} budget={totalBudget} />
      )}

      {/* 类型筛选标签 */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filterType === opt.key
            const isExpense = opt.key === 'expense'
            const isIncome = opt.key === 'income'
            let activeColor = ''
            if (isActive) {
              if (isExpense) activeColor = 'bg-white text-red-600 shadow-sm'
              else if (isIncome) activeColor = 'bg-white text-green-600 shadow-sm'
              else activeColor = 'bg-white text-primary-600 shadow-sm'
            }
            return (
              <button
                key={opt.key}
                onClick={() => handleFilterChange(opt.key)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all
                  ${isActive ? activeColor : 'text-gray-500 hover:text-gray-700'}`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 账单列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ExpenseList
          expenses={expenses}
          loading={loading}
          onDelete={removeExpense}
        />
      </div>

      {/* 浮动添加按钮 */}
      <button
        onClick={() => setShowForm(true)}
        className="absolute bottom-6 right-6 w-14 h-14
          bg-primary-600 hover:bg-primary-700
          text-white text-2xl rounded-2xl
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200
          active:scale-95"
      >
        +
      </button>

      {/* 记账弹窗 */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="记一笔"
      >
        <ExpenseForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}

// ==================== 子组件 ====================

/** 预算进度条 */
function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const percent = Math.min(Math.round((spent / budget) * 100), 100)

  const barColor =
    percent < 70 ? 'bg-emerald-500' : percent < 90 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    percent < 70 ? 'text-emerald-700' : percent < 90 ? 'text-amber-700' : 'text-red-700'

  return (
    <div className="px-6 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">月预算（仅支出）</span>
        <span className={`text-xs font-semibold ${textColor}`}>
          ¥{centsToYuan(spent)} / ¥{centsToYuan(budget)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
      <p className={`text-xs mt-1 ${textColor}`}>
        {percent >= 90
          ? `⚠️ 已使用 ${percent}%，注意控制支出！`
          : percent >= 70
          ? `已使用 ${percent}%，接近预算上限`
          : `已使用 ${percent}%`}
      </p>
    </div>
  )
}
