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
import { useCategories, type MainCategoryItem } from '@/hooks/useCategories'
import { exportDataAsCsv } from '@/utils/exportData'

export default function SettingsPage() {
  const { budgets, totalBudget, categoryBudgets, loading, refresh, saveBudget, removeBudget } =
    useBudget()

  // 分类管理
  const {
    expenseCategories,
    incomeCategories,
    records: allCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories()

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
  const availableCategories = expenseCategories.filter(
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
                    const icon = expenseCategories.find((c) => c.name === name)?.icon || '💰'
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

            {/* ========== 分类管理 ========== */}
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

// ==================== 分类管理子组件 ====================

/** 常用 emoji 供用户选择 */
const EMOJI_GRID = [
  '🍜', '🍱', '🍲', '🍎', '🥂', '☕', '🍔', '🍕', '🍰', '🧋',
  '🚗', '🚌', '🚕', '⛽', '🅿️', '✈️', '🚲', '🚄', '🛵', '🚶',
  '🛒', '👗', '📱', '🧴', '🛋️', '💄', '👟', '💻', '📦', '🎒',
  '🏠', '🔑', '🏦', '💡', '🏢', '🔧', '📶', '🛏️', '🚿', '🧹',
  '💊', '🏥', '💉', '🩺', '🦷', '🏃', '🧘', '💇', '🩹', '😴',
  '🎮', '📚', '🎬', '🏖️', '🐾', '🎨', '🎵', '📷', '🎂', '🎤',
  '🎁', '🧧', '🎀', '👴', '🤝', '💐', '🎉', '👶', '💌', '🙏',
  '💰', '📈', '💼', '📊', '💳', '📮', '🧾', '❓', '⭐', '🔥',
]

interface CategoryManagerProps {
  expenseCategories: MainCategoryItem[]
  incomeCategories: { id: number; name: string; icon: string; is_preset: number }[]
  allCategories: Array<{ id: number; name: string; icon: string; parent_id: number | null; type: string; is_preset: number }>
  onAdd: (data: { name: string; icon: string; parent_id: number | null; type: 'expense' | 'income' }) => Promise<number>
  onUpdate: (id: number, data: { name: string; icon: string; parent_id?: number | null }) => Promise<void>
  onDelete: (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => Promise<number>
}

function CategoryManager({ expenseCategories, incomeCategories, allCategories, onAdd, onUpdate, onDelete }: CategoryManagerProps) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editParentId, setEditParentId] = useState<number | null>(null)
  const [showEditEmojiGrid, setShowEditEmojiGrid] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addParentId, setAddParentId] = useState<number | null>(null)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('📦')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ name: string; type: 'expense' | 'income'; parentId: number | null } | null>(null)

  const isExpense = tab === 'expense'
  const categories = isExpense ? expenseCategories : incomeCategories

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStartEdit = (id: number, name: string, icon: string, parentId: number | null = null) => {
    setEditingId(id)
    setEditName(name)
    setEditIcon(icon)
    setEditParentId(parentId)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditIcon('')
    setEditParentId(null)
    setShowEditEmojiGrid(false)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || editingId === null) return
    // 支出分类才允许改归属，收入分类不传 parent_id（保持扁平）
    const parentId = isExpense ? editParentId : undefined
    await onUpdate(editingId, { name: editName.trim(), icon: editIcon || '💰', parent_id: parentId })
    handleCancelEdit()
  }

  const handleAdd = async () => {
    if (!addName.trim()) return
    await onAdd({
      name: addName.trim(),
      icon: addIcon || '💰',
      parent_id: addParentId,
      type: tab,
    })
    setShowAddForm(false)
    setAddName('')
    setAddIcon('📦')
    setAddParentId(null)
  }

  const handleDeleteClick = (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => {
    setDeletingId(id)
    setDeleteInfo({ name, type, parentId })
  }

  const handleDeleteConfirm = async () => {
    if (deletingId === null || !deleteInfo) return
    await onDelete(deletingId, deleteInfo.name, deleteInfo.type, deleteInfo.parentId)
    setDeletingId(null)
    setDeleteInfo(null)
  }

  const handleDeleteCancel = () => {
    setDeletingId(null)
    setDeleteInfo(null)
  }

  const parentOptions = allCategories.filter(
    (c) => c.type === tab && c.parent_id === null
  )

  return (
    <section className="bg-gray-50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">分类管理</h3>

      {/* 收支 Tab */}
      <div className="flex bg-gray-200 rounded-lg p-0.5 mb-4 w-fit">
        <button
          onClick={() => setTab('expense')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all
            ${isExpense ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          支出分类
        </button>
        <button
          onClick={() => setTab('income')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all
            ${!isExpense ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          收入分类
        </button>
      </div>

      {/* 分类列表 */}
      <ul className="space-y-1 mb-4">
        {categories.map((cat) => {
          const isPreset = cat.is_preset === 1
          const isExpanded = expandedIds.has(cat.id)
          const isEditing = editingId === cat.id
          const isDeleting = deletingId === cat.id
          const subCategories = isExpense
            ? ('subCategories' in cat ? (cat as MainCategoryItem).subCategories : [])
            : []

          return (
            <li key={cat.id}>
              {/* 一级分类行 */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors
                  ${isDeleting ? 'bg-red-50' : 'bg-white'}`}
              >
                {isExpense && subCategories.length > 0 && (
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {isExpanded ? '▾' : '▸'}
                  </button>
                )}
                {(!isExpense || subCategories.length === 0) && <span className="w-5" />}

                {isEditing ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 图标选择按钮 */}
                      <button
                        type="button"
                        onClick={() => setShowEditEmojiGrid(!showEditEmojiGrid)}
                        className="w-8 h-8 flex items-center justify-center text-lg border rounded-lg
                                   hover:bg-gray-50 transition-colors shrink-0"
                        title="点击选择图标"
                      >
                        {editIcon}
                      </button>
                      {/* 支出分类编辑时可改归属 */}
                    {isExpense && (
                      <select
                        value={editParentId ?? ''}
                        onChange={(e) =>
                          setEditParentId(e.target.value ? Number(e.target.value) : null)
                        }
                        className="px-2 py-1 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400"
                      >
                        <option value="">一级分类</option>
                        {parentOptions
                          .filter((p) => p.id !== editingId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.icon} {p.name}
                            </option>
                          ))}
                      </select>
                    )}
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-[80px] px-2 py-1 text-sm border rounded-lg focus:outline-none focus:border-primary-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                  {/* emoji 选择面板 */}
                  {showEditEmojiGrid && (
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {EMOJI_GRID.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setEditIcon(emoji)
                            setShowEditEmojiGrid(false)
                          }}
                          className={`w-7 h-7 flex items-center justify-center rounded text-sm
                            transition-colors
                            ${editIcon === emoji ? 'bg-primary-100 ring-1 ring-primary-400' : 'hover:bg-gray-100'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                ) : isDeleting ? (
                  <>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                    <span className="text-xs text-red-500">确认删除？</span>
                    <button
                      onClick={handleDeleteConfirm}
                      className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      确认
                    </button>
                    <button
                      onClick={handleDeleteCancel}
                      className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
                    {isPreset ? (
                      <span className="text-xs text-gray-300">预置</span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(cat.id, cat.name, cat.icon, null)}
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-primary-600 hover:bg-gray-100 text-xs"
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteClick(cat.id, cat.name, tab, null)
                          }
                          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 text-xs"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 展开的子分类列表（仅支出） */}
              {isExpense && isExpanded && subCategories.length > 0 && (
                <ul className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-4">
                  {subCategories.map((sub) => {
                    const subIsPreset = sub.is_preset === 1
                    const subIsEditing = editingId === sub.id
                    const subIsDeleting = deletingId === sub.id

                    return (
                      <li key={sub.id}>
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors
                            ${subIsDeleting ? 'bg-red-50' : 'bg-white/70'}`}
                        >
                          {subIsEditing ? (
                            <div className="flex flex-col gap-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setShowEditEmojiGrid(!showEditEmojiGrid)}
                                  className="w-7 h-7 flex items-center justify-center text-base border rounded-lg
                                             hover:bg-gray-50 transition-colors shrink-0"
                                  title="点击选择图标"
                                >
                                  {editIcon}
                                </button>
                              {/* 子分类可改归属到其他一级分类或改为一级 */}
                              <select
                                value={editParentId ?? ''}
                                onChange={(e) =>
                                  setEditParentId(e.target.value ? Number(e.target.value) : null)
                                }
                                className="px-2 py-1 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400"
                              >
                                <option value="">一级分类</option>
                                {parentOptions
                                  .filter((p) => p.id !== editingId)
                                  .map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.icon} {p.name}
                                    </option>
                                  ))}
                              </select>
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 min-w-[80px] px-2 py-1 text-sm border rounded-lg focus:outline-none focus:border-primary-400"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                              >
                                取消
                              </button>
                            </div>
                            {/* emoji 选择面板 */}
                            {showEditEmojiGrid && (
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                {EMOJI_GRID.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      setEditIcon(emoji)
                                      setShowEditEmojiGrid(false)
                                    }}
                                    className={`w-7 h-7 flex items-center justify-center rounded text-sm
                                      transition-colors
                                      ${editIcon === emoji ? 'bg-primary-100 ring-1 ring-primary-400' : 'hover:bg-gray-100'}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          ) : subIsDeleting ? (
                            <>
                              <span className="text-base">{sub.icon}</span>
                              <span className="flex-1 text-sm text-gray-700">{sub.name}</span>
                              <span className="text-xs text-red-500">确认删除？</span>
                              <button
                                onClick={handleDeleteConfirm}
                                className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                              >
                                确认
                              </button>
                              <button
                                onClick={handleDeleteCancel}
                                className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-base">{sub.icon}</span>
                              <span className="flex-1 text-sm text-gray-600">{sub.name}</span>
                              {subIsPreset ? (
                                <span className="text-xs text-gray-300">预置</span>
                              ) : (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleStartEdit(sub.id, sub.name, sub.icon, cat.id)}
                                    className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-primary-600 text-xs"
                                    title="编辑"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(sub.id, sub.name, tab, cat.id)
                                    }
                                    className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 text-xs"
                                    title="删除"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {/* 新增分类表单 */}
      {showAddForm ? (
        <div className="bg-white rounded-xl p-4 space-y-3">
          {isExpense && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 w-14">父级</label>
              <select
                value={addParentId ?? ''}
                onChange={(e) =>
                  setAddParentId(e.target.value ? Number(e.target.value) : null)
                }
                className="flex-1 px-2 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400"
              >
                <option value="">一级分类</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.icon} {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-14">名称</label>
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={isExpense ? '如：宠物开销' : '如：退款'}
              className="flex-1 px-2 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              图标：<span className="text-lg ml-1">{addIcon}</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {EMOJI_GRID.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAddIcon(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg
                    transition-colors
                    ${addIcon === emoji ? 'bg-primary-100 ring-1 ring-primary-400' : 'hover:bg-gray-100'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!addName.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white
                         hover:bg-primary-700 disabled:opacity-40 transition-colors"
            >
              添加
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setAddName('')
                setAddIcon('📦')
                setAddParentId(null)
              }}
              className="px-4 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="text-sm px-4 py-2 rounded-xl bg-white border-2 border-dashed
                     border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-600
                     transition-colors"
        >
          + 新增分类
        </button>
      )}

      <p className="text-xs text-gray-400 mt-3">
        预置分类不可修改或删除。删除自定义分类时，相关收支记录的分类将显示为"未分类"。
      </p>
    </section>
  )
}
