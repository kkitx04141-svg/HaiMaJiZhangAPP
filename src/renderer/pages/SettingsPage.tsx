/**
 * 设置页面 —— 预算管理 + 数据管理 + 分类管理
 *
 * 功能分区：
 * - 月份选择器：切换查看不同月份的预算
 * - 月度总预算（BudgetSection 组件）：设置/修改/清除
 * - 分类预算（CategoryBudgetSection 组件）：各分类独立预算
 * - 数据管理：导出全部记录为 CSV 文件
 * - 分类管理（CategoryManager 组件）：新增/修改/删除分类
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { getCurrentMonth, formatMonth } from '@/utils/formatDate'
import { centsToYuan, yuanToCents } from '@/utils/formatMoney'
import { useCategories } from '@/hooks/useCategories'
import CategoryManager from '@/components/CategoryManager'
import BudgetSection from '@/components/BudgetSection'
import CategoryBudgetSection from '@/components/CategoryBudgetSection'
import { exportDataAsCsv } from '@/utils/exportData'

export default function SettingsPage() {
  const { budgets, totalBudget, categoryBudgets, loading, refresh, saveBudget, removeBudget } = useBudget()
  const { expenseCategories, incomeCategories, records: allCategories, addCategory, updateCategory, deleteCategory } = useCategories()

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

  // --- 总预算编辑状态 ---
  const [totalText, setTotalText] = useState('')
  const [totalEditing, setTotalEditing] = useState(false)

  // --- 分类预算新增 ---
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatMain, setNewCatMain] = useState('')
  const [newCatAmount, setNewCatAmount] = useState('')

  // --- 数据导出 ---
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try { await exportDataAsCsv() } finally { setExporting(false) }
  }

  // 排除已设预算的分类
  const availableCategories = expenseCategories.filter((c) => !categoryBudgets.has(c.name))

  // 月份切换
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      const [y, m] = prev.split('-').map(Number)
      return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
    })
  }, [])

  const canGoNext = currentMonth < getCurrentMonth()

  // 月份变化 → 刷新预算
  useEffect(() => { refresh(currentMonth) }, [currentMonth, refresh])

  // 总预算变化 → 同步输入框文本（分→元）
  useEffect(() => {
    setTotalText(totalBudget !== null ? centsToYuan(totalBudget) : '')
    setTotalEditing(false)
  }, [totalBudget])

  // 保存总预算
  const handleSaveTotal = async (e: FormEvent) => {
    e.preventDefault()
    const num = parseFloat(totalText)
    if (isNaN(num) || num < 0) return
    await saveBudget(currentMonth, yuanToCents(num), null)
    setTotalEditing(false)
  }

  // 添加分类预算
  const handleAddCategoryBudget = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCatMain) return
    const num = parseFloat(newCatAmount)
    if (isNaN(num) || num <= 0) return
    await saveBudget(currentMonth, yuanToCents(num), newCatMain)
    setNewCatMain(''); setNewCatAmount(''); setShowAddCategory(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 月份选择器 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={goToPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          ◂
        </button>
        <span className="text-sm font-medium text-gray-700">{formatMonth(currentMonth)}</span>
        <button onClick={goToNextMonth} disabled={!canGoNext}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${canGoNext ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}>
          ▸
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">预算设置</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <span className="animate-pulse">加载中…</span>
          </div>
        ) : (
          <>
            {/* 月度总预算 */}
            <BudgetSection
              totalBudget={totalBudget} totalText={totalText} totalEditing={totalEditing}
              onSetTotalText={setTotalText} onSave={handleSaveTotal}
              onStartEdit={() => setTotalEditing(true)}
              onClear={() => { setTotalEditing(true); setTotalText('') }}
              onCancel={() => { setTotalText(totalBudget !== null ? centsToYuan(totalBudget) : ''); setTotalEditing(false) }}
            />

            {/* 分类预算 */}
            <CategoryBudgetSection
              categoryBudgets={categoryBudgets} expenseCategories={expenseCategories}
              budgets={budgets} availableCategories={availableCategories}
              showAddCategory={showAddCategory} newCatMain={newCatMain} newCatAmount={newCatAmount}
              onSetShowAddCategory={setShowAddCategory} onSetNewCatMain={setNewCatMain}
              onSetNewCatAmount={setNewCatAmount} onAdd={handleAddCategoryBudget}
              onRemoveBudget={removeBudget} currentMonth={currentMonth}
            />

            {/* 数据导出 */}
            <section className="bg-gray-50 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">数据管理</h3>
              <p className="text-xs text-gray-400 mb-4">
                导出全部收支记录为 CSV 文件，可用于 Excel 查看或存档备份。
                数据始终存储在您的电脑上，不会上传到任何服务器。
              </p>
              <button onClick={handleExport} disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 disabled:opacity-50 transition-colors">
                <span>{exporting ? '⏳' : '📥'}</span>
                <span>{exporting ? '导出中…' : '导出 CSV'}</span>
              </button>
            </section>

            {/* 分类管理 */}
            <CategoryManager
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              allCategories={allCategories}
              onAdd={addCategory}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
            />
          </>
        )}
      </div>
    </div>
  )
}
