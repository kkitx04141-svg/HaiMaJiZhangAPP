/**
 * 分类预算区块
 *
 * 为各个支出分类单独设置预算上限（可选）：
 * - 已设预算的分类以列表展示，每项可删除
 * - 可展开新增表单，选择分类并输入金额
 * - 当所有分类都已设预算时，新增按钮置灰
 */

import { type FormEvent } from 'react'
import { centsToYuan } from '@/utils/formatMoney'

interface CategoryBudgetSectionProps {
  categoryBudgets: Map<string, number>
  expenseCategories: { name: string; icon: string }[]
  budgets: { id: number; category_main: string | null }[]
  availableCategories: { name: string; icon: string }[]
  showAddCategory: boolean
  newCatMain: string
  newCatAmount: string
  onSetShowAddCategory: (v: boolean) => void
  onSetNewCatMain: (v: string) => void
  onSetNewCatAmount: (v: string) => void
  onAdd: (e: FormEvent) => void
  onRemoveBudget: (id: number, month: string) => void
  currentMonth: string
}

export default function CategoryBudgetSection({
  categoryBudgets, expenseCategories, budgets, availableCategories,
  showAddCategory, newCatMain, newCatAmount,
  onSetShowAddCategory, onSetNewCatMain, onSetNewCatAmount,
  onAdd, onRemoveBudget, currentMonth,
}: CategoryBudgetSectionProps) {
  return (
    <section className="bg-gray-50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        分类预算
        <span className="text-gray-400 font-normal ml-1 text-xs">（可选）</span>
      </h3>

      {/* 已设的分类预算列表 */}
      {categoryBudgets.size > 0 ? (
        <ul className="space-y-2 mb-4">
          {Array.from(categoryBudgets.entries()).map(([name, amount]) => {
            // 从分类列表中找对应图标，找不到用 💰 兜底
            const icon = expenseCategories.find((c) => c.name === name)?.icon || '💰'
            // 从预算原始记录中找到 id（用于删除）
            const record = budgets.find((b) => b.category_main === name)
            return (
              <li
                key={name}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5"
              >
                <span className="text-lg">{icon}</span>
                <span className="flex-1 text-sm text-gray-700">{name}</span>
                <span className="text-sm font-semibold text-primary-600">
                  ¥{centsToYuan(amount)}
                </span>
                <button
                  onClick={() => {
                    if (record) {
                      onRemoveBudget(record.id, currentMonth)
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 mb-4">尚未设置分类预算</p>
      )}

      {/* 新增分类预算表单 / 新增按钮 */}
      {showAddCategory ? (
        <form
          onSubmit={onAdd}
          className="flex items-center gap-2 flex-wrap"
        >
          <select
            value={newCatMain}
            onChange={(e) => onSetNewCatMain(e.target.value)}
            className="px-3 py-2 text-sm bg-white rounded-xl border-2 border-gray-200
                       focus:border-primary-400 focus:outline-none"
          >
            <option value="">选择分类</option>
            {availableCategories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            value={newCatAmount}
            onChange={(e) => onSetNewCatAmount(e.target.value)}
            placeholder="金额"
            className="w-24 px-3 py-2 text-sm bg-white rounded-xl border-2 border-gray-200
                       focus:border-primary-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium
                       bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            添加
          </button>
          <button
            type="button"
            onClick={() => onSetShowAddCategory(false)}
            className="px-3 py-2 rounded-xl text-sm text-gray-500
                       hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
        </form>
      ) : (
        <button
          onClick={() => onSetShowAddCategory(true)}
          disabled={availableCategories.length === 0}
          className={`text-sm px-4 py-2 rounded-xl transition-colors
            ${availableCategories.length > 0
              ? 'bg-white border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-600'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
        >
          + 添加分类预算
        </button>
      )}
    </section>
  )
}
