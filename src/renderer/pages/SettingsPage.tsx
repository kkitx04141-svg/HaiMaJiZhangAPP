/**
 * 设置页面 —— 预算管理 + 数据管理
 *
 * 功能：
 * - 按月份设置总预算
 * - 给各分类设置独立预算（可选）
 * - 已有预算可删除
 * - 数据导出为 CSV 备份
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { getCurrentMonth, formatMonth } from '@/utils/formatDate'
import { centsToYuan, yuanToCents } from '@/utils/formatMoney'
import { CATEGORIES } from '@/constants/categories'
import { exportDataAsCsv } from '@/utils/exportData'

export default function SettingsPage() {
  const { budgets, totalBudget, categoryBudgets, loading, refresh, saveBudget, removeBudget } =
    useBudget()

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

  // ---- 总预算编辑状态 ----
  const [totalText, setTotalText] = useState('')
  const [totalEditing, setTotalEditing] = useState(false)

  // ---- 添加分类预算 ----
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatMain, setNewCatMain] = useState('')
  const [newCatAmount, setNewCatAmount] = useState('')

  // ---- 数据导出 ----
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportDataAsCsv()
    } finally {
      setExporting(false)
    }
  }

  // 还可以添加的分类（排除已设预算的）
  const availableCategories = CATEGORIES.filter(
    (c) => !categoryBudgets.has(c.name)
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

  const canGoNext = currentMonth < getCurrentMonth()

  // 月份变化时刷新预算数据
  useEffect(() => {
    refresh(currentMonth)
  }, [currentMonth, refresh])

  // 总预算变化时同步文本
  useEffect(() => {
    setTotalText(totalBudget !== null ? centsToYuan(totalBudget) : '')
    setTotalEditing(false)
  }, [totalBudget])

  // ---- 保存总预算 ----
  const handleSaveTotal = async (e: FormEvent) => {
    e.preventDefault()
    const num = parseFloat(totalText)
    if (isNaN(num) || num < 0) return
    await saveBudget(currentMonth, yuanToCents(num), null)
    setTotalEditing(false)
  }

  // ---- 删除总预算（设为 0 或不设限）----
  const handleClearTotal = async () => {
    setTotalEditing(true)
    setTotalText('')
  }

  // ---- 添加分类预算 ----
  const handleAddCategoryBudget = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCatMain) return
    const num = parseFloat(newCatAmount)
    if (isNaN(num) || num <= 0) return
    await saveBudget(currentMonth, yuanToCents(num), newCatMain)
    setNewCatMain('')
    setNewCatAmount('')
    setShowAddCategory(false)
  }

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

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">预算设置</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <span className="animate-pulse">加载中…</span>
          </div>
        ) : (
          <>
            {/* ========== 月度总预算 ========== */}
            <section className="bg-gray-50 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">月度总预算</h3>

              {!totalEditing && totalBudget !== null ? (
                // 已设置 — 展示态
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{centsToYuan(totalBudget!)}
                  </span>
                  <button
                    onClick={() => setTotalEditing(true)}
                    className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-200
                               text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                  >
                    修改
                  </button>
                  <button
                    onClick={handleClearTotal}
                    className="text-xs px-3 py-1 rounded-lg bg-white border border-gray-200
                               text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                  >
                    清除
                  </button>
                </div>
              ) : (
                // 编辑态 / 未设置
                <form onSubmit={handleSaveTotal} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      ¥
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={totalText}
                      onChange={(e) => setTotalText(e.target.value)}
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
                      onClick={() => {
                        setTotalText(centsToYuan(totalBudget!))
                        setTotalEditing(false)
                      }}
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

            {/* ========== 分类预算 ========== */}
            <section className="bg-gray-50 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                分类预算
                <span className="text-gray-400 font-normal ml-1 text-xs">（可选）</span>
              </h3>

              {/* 已设的分类预算 */}
              {categoryBudgets.size > 0 ? (
                <ul className="space-y-2 mb-4">
                  {Array.from(categoryBudgets.entries()).map(([name, amount]) => {
                    const icon = CATEGORIES.find((c) => c.name === name)?.icon || '💰'
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
                              removeBudget(record.id, currentMonth)
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

              {/* 添加分类预算 */}
              {showAddCategory ? (
                <form
                  onSubmit={handleAddCategoryBudget}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <select
                    value={newCatMain}
                    onChange={(e) => setNewCatMain(e.target.value)}
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
                    onChange={(e) => setNewCatAmount(e.target.value)}
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
                    onClick={() => setShowAddCategory(false)}
                    className="px-3 py-2 rounded-xl text-sm text-gray-500
                               hover:bg-gray-100 transition-colors"
                  >
                    取消
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddCategory(true)}
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

            {/* ========== 数据管理 ========== */}
            <section className="bg-gray-50 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-700 mb-3">数据管理</h3>
              <p className="text-xs text-gray-400 mb-4">
                导出全部收支记录为 CSV 文件，可用于 Excel 查看或存档备份。
                数据始终存储在您的电脑上，不会上传到任何服务器。
              </p>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                           bg-white border-2 border-gray-200 text-gray-700
                           hover:border-primary-300 hover:text-primary-600
                           disabled:opacity-50 transition-colors"
              >
                <span>{exporting ? '⏳' : '📥'}</span>
                <span>{exporting ? '导出中…' : '导出 CSV'}</span>
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
