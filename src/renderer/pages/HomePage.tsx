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

/** 筛选类型：全部、支出、收入 */
type FilterType = 'all' | 'expense' | 'income'

/** 预算使用率超过 70% 时黄色预警 */
const BUDGET_WARNING_THRESHOLD = 70
/** 预算使用率超过 90% 时红色警告 */
const BUDGET_DANGER_THRESHOLD = 90

/** 筛选标签配置 */
const FILTER_OPTIONS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

export default function HomePage() {
  // 数据层：从自定义 Hook 获取收支列表和预算
  const { expenses, loading, refresh, addExpense, removeExpense } = useExpenses()
  const { totalBudget, refresh: refreshBudget } = useBudget()

  // 页面状态：当前查看的月份
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())
  // 是否显示记账弹窗
  const [showForm, setShowForm] = useState(false)
  // 当前激活的筛选标签
  const [filterType, setFilterType] = useState<FilterType>('all')

  // 计算当月总支出（仅统计 type='expense' 的记录，单位为分）
  const spent = useMemo(
    () => expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  // 切换到上一个月（1 月 → 上一年 12 月）
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      if (m === 1) return `${y - 1}-12`
      return `${y}-${String(m - 1).padStart(2, '0')}`
    })
  }, [])

  // 切换到下一个月（12 月 → 下一年 1 月）
  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      if (m === 12) return `${y + 1}-01`
      return `${y}-${String(m + 1).padStart(2, '0')}`
    })
  }, [])

  // 月份或筛选类型变化时，重新拉取数据和预算
  useEffect(() => {
    refresh(currentMonth, filterType === 'all' ? undefined : filterType)
    refreshBudget(currentMonth)
  }, [currentMonth, filterType, refresh, refreshBudget])

  // 保存新记账记录
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
    // 如果新记录属于当前查看的月份，刷新列表和预算
    const expenseMonth = data.date.slice(0, 7)
    if (expenseMonth === currentMonth) {
      refresh(currentMonth, filterType === 'all' ? undefined : filterType)
      refreshBudget(currentMonth)
    }
  }

  // 切换筛选标签（全部/支出/收入）
  const handleFilterChange = (key: FilterType) => {
    setFilterType(key)
  }

  // 只能切换到当月及之前的月份，不能查看未来
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

      {/* 类型筛选标签：全部 / 支出 / 收入 */}
      <div className="px-6 py-3 border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filterType === opt.key
            const isExpense = opt.key === 'expense'
            const isIncome = opt.key === 'income'
            // 选中状态下不同的颜色：支出红、收入绿、全部蓝
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

      {/* 账单列表：按日期分组，支出红/收入绿 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ExpenseList
          expenses={expenses}
          loading={loading}
          onDelete={removeExpense}
        />
      </div>

      {/* 右下角浮动添加按钮（FAB） */}
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

      {/* 记账弹窗：Modal 包裹 ExpenseForm */}
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

/**
 * 预算进度条
 *
 * 显示当月支出的预算使用情况：
 * - 绿色（<70%）：正常
 * - 黄色（70%-89%）：预警
 * - 红色（≥90%）：警告
 */
function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  // 使用率百分比（上限 100%，避免进度条溢出）
  const percent = Math.min(Math.round((spent / budget) * 100), 100)

  // 根据阈值切换进度条颜色
  const barColor =
    percent < BUDGET_WARNING_THRESHOLD ? 'bg-emerald-500' : percent < BUDGET_DANGER_THRESHOLD ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    percent < BUDGET_WARNING_THRESHOLD ? 'text-emerald-700' : percent < BUDGET_DANGER_THRESHOLD ? 'text-amber-700' : 'text-red-700'

  return (
    <div className="px-6 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-500">月预算（仅支出）</span>
        <span className={`text-xs font-semibold ${textColor}`}>
          ¥{centsToYuan(spent)} / ¥{centsToYuan(budget)}
        </span>
      </div>
      {/* 进度条本体：灰色底 + 彩色填充 */}
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.max(percent, 2)}%` }}
        />
      </div>
      {/* 文案提示 */}
      <p className={`text-xs mt-1 ${textColor}`}>
        {percent >= BUDGET_DANGER_THRESHOLD
          ? `⚠️ 已使用 ${percent}%，注意控制支出！`
          : percent >= BUDGET_WARNING_THRESHOLD
          ? `已使用 ${percent}%，接近预算上限`
          : `已使用 ${percent}%`}
      </p>
    </div>
  )
}
