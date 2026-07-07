/**
 * 月度总预算区块
 *
 * 有三种状态：
 * - 已设置展示态：显示金额 + 修改/清除按钮
 * - 编辑态（含新增和修改）：显示输入框 + 保存/取消按钮
 * - 未设置：直接显示输入框
 *
 * 金额输入单位为元，内部自动转换为分存储。
 */

import { type FormEvent } from 'react'
import { centsToYuan } from '@/utils/formatMoney'

interface BudgetSectionProps {
  totalBudget: number | null
  totalText: string
  totalEditing: boolean
  onSetTotalText: (v: string) => void
  onSave: (e: FormEvent) => void
  onStartEdit: () => void
  onClear: () => void
  onCancel: () => void
}

export default function BudgetSection({
  totalBudget, totalText, totalEditing,
  onSetTotalText, onSave, onStartEdit, onClear, onCancel,
}: BudgetSectionProps) {
  return (
    <section className="bg-gray-50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-3">月度总预算</h3>

      {!totalEditing && totalBudget !== null ? (
        /* 已设置 — 展示态 */
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary-600">
            ¥{centsToYuan(totalBudget)}
          </span>
          <button
            onClick={onStartEdit}
            className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-200
                       text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
          >
            修改
          </button>
          <button
            onClick={onClear}
            className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-200
                       text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            清除
          </button>
        </div>
      ) : (
        /* 编辑态 / 未设置 */
        <form onSubmit={onSave} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              ¥
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={totalText}
              onChange={(e) => onSetTotalText(e.target.value)}
              placeholder="如：5000"
              autoFocus
              className="w-full pl-8 pr-4 py-2.5 text-lg font-bold bg-white
                         rounded-xl border-2 border-transparent
                         focus:border-primary-400 focus:outline-none
                         placeholder:text-gray-300 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-medium
                       bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            保存
          </button>
          {totalBudget !== null && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium
                         bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          )}
        </form>
      )}

      <p className="text-xs text-gray-400 mt-2">
        不设置则不限总额
      </p>
    </section>
  )
}
