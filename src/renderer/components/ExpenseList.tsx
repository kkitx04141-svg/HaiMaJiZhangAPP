/**
 * 账单列表组件
 *
 * 按日期分组展示收支记录：
 * - 每组顶部显示日期标签（"今天"、"昨天"、"7月5日"…）
 * - 每条显示：分类图标、分类名、金额、备注
 * - 支出：红色 -¥，收入：绿色 +¥
 * - 每个条目可点击删除（需二次确认）
 * - 无数据时显示空状态
 */

import { useState } from 'react'
import { centsToYuan } from '@/utils/formatMoney'
import { getDateLabel } from '@/utils/formatDate'
import { useCategories } from '@/hooks/useCategories'
import type { ExpenseRecord } from '@/db/expenseRepo'

interface ExpenseListProps {
  /** 记录列表（已排序） */
  expenses: ExpenseRecord[]
  /** 加载中 */
  loading?: boolean
  /** 删除回调 */
  onDelete: (id: number) => void
}

export default function ExpenseList({ expenses, loading, onDelete }: ExpenseListProps) {
  const { getRecordIcon } = useCategories()
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const grouped = groupByDate(expenses)

  const handleDeleteClick = (id: number) => {
    if (confirmingId === id) {
      onDelete(id)
      setConfirmingId(null)
    } else {
      setConfirmingId(id)
    }
  }

  const handleBlur = () => {
    setConfirmingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <span className="animate-pulse">加载中…</span>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <span className="text-5xl mb-4">📋</span>
        <p className="text-sm">还没有记账记录</p>
        <p className="text-xs mt-1 text-gray-300">点击右下角 + 按钮记一笔吧</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5" onClick={handleBlur}>
      {grouped.map(([dateLabel, items]) => (
        <section key={dateLabel}>
          {/* 日期标签 */}
          <h3 className="text-xs font-medium text-gray-400 mb-2 px-2">
            {dateLabel}
          </h3>

          {/* 该日期下的条目 */}
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const isExpense = item.type === 'expense'
              const icon = getRecordIcon(item.type, item.category_main, item.category_sub)
              const isConfirming = confirmingId === item.id

              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-colors cursor-pointer select-none
                    ${isConfirming
                      ? 'bg-red-50 border border-red-200'
                      : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  onClick={() => handleDeleteClick(item.id)}
                >
                  {/* 分类图标 */}
                  <span className="text-xl shrink-0">{icon}</span>

                  {/* 分类名 + 备注 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {isExpense ? item.category_sub : item.category_main}
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {item.note}
                      </p>
                    )}
                  </div>

                  {/* 金额 */}
                  <span
                    className={`text-sm font-semibold shrink-0
                      ${isExpense ? 'text-expense' : 'text-income'}`}
                  >
                    {isExpense ? '-' : '+'}¥{centsToYuan(item.amount)}
                  </span>

                  {/* 删除按钮 */}
                  <span
                    className={`text-xs shrink-0 transition-all
                      ${isConfirming
                        ? 'text-red-600 font-medium px-2'
                        : 'text-gray-400 opacity-0 group-hover:opacity-100'
                      }`}
                  >
                    {isConfirming ? '确认删除？' : '🗑️'}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * 按日期对记录列表分组
 */
function groupByDate(records: ExpenseRecord[]): Array<[string, ExpenseRecord[]]> {
  const map = new Map<string, ExpenseRecord[]>()
  for (const r of records) {
    const label = getDateLabel(r.date)
    const group = map.get(label)
    if (group) {
      group.push(r)
    } else {
      map.set(label, [r])
    }
  }
  return Array.from(map.entries())
}
