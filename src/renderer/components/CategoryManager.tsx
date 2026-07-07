/**
 * 分类管理组件
 *
 * 让用户在设置页中管理支出和收入的分类体系：
 * - 支出分类：两级结构（一级大类 → 二级小类），支持展开/折叠
 * - 收入分类：扁平列表（无二级）
 * - 支持新增、修改（名称、图标、归属）、删除分类
 * - 预置分类不可修改或删除（is_preset=1）
 */

import { useState } from 'react'
import type { MainCategoryItem } from '@/hooks/useCategories'

// ==================== Emoji 图标选择器 ====================

/** 常用 emoji 供用户选择分类图标（8行 × 10列） */
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

// ==================== 类型定义 ====================

/** 分类记录（来自 useCategories Hook 的原始数据） */
interface CategoryRecord {
  id: number
  name: string
  icon: string
  parent_id: number | null
  type: string
  is_preset: number
}

interface CategoryManagerProps {
  /** 支出分类（两级结构） */
  expenseCategories: MainCategoryItem[]
  /** 收入分类（扁平列表） */
  incomeCategories: { id: number; name: string; icon: string; is_preset: number }[]
  /** 全部分类原始记录（用于查找父级选项） */
  allCategories: CategoryRecord[]
  /** 新增分类回调 */
  onAdd: (data: { name: string; icon: string; parent_id: number | null; type: 'expense' | 'income' }) => Promise<number>
  /** 修改分类回调 */
  onUpdate: (id: number, data: { name: string; icon: string; parent_id?: number | null }) => Promise<void>
  /** 删除分类回调（含级联处理） */
  onDelete: (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => Promise<number>
}

// ==================== 组件 ====================

export default function CategoryManager({
  expenseCategories,
  incomeCategories,
  allCategories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  // 当前查看的 Tab：支出 or 收入
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  // 已展开的一级分类 id 集合（用于显示二级小类）
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // 编辑状态
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editParentId, setEditParentId] = useState<number | null>(null)
  const [showEditEmojiGrid, setShowEditEmojiGrid] = useState(false)

  // 新增状态
  const [showAddForm, setShowAddForm] = useState(false)
  const [addParentId, setAddParentId] = useState<number | null>(null)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('📦')

  // 删除确认状态
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ name: string; type: 'expense' | 'income'; parentId: number | null } | null>(null)

  const isExpense = tab === 'expense'
  const categories = isExpense ? expenseCategories : incomeCategories

  /** 切换展开/折叠二级分类 */
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** 开始编辑某个分类 */
  const handleStartEdit = (id: number, name: string, icon: string, parentId: number | null = null) => {
    setEditingId(id)
    setEditName(name)
    setEditIcon(icon)
    setEditParentId(parentId)
  }

  /** 取消编辑 */
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditIcon('')
    setEditParentId(null)
    setShowEditEmojiGrid(false)
  }

  /** 保存编辑（修改名称/图标/归属） */
  const handleSaveEdit = async () => {
    if (!editName.trim() || editingId === null) return
    // 支出分类才允许改归属到其他一级分类，收入分类保持扁平
    const parentId = isExpense ? editParentId : undefined
    await onUpdate(editingId, { name: editName.trim(), icon: editIcon || '💰', parent_id: parentId })
    handleCancelEdit()
  }

  /** 新增分类 */
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

  /** 点击删除按钮 → 进入确认态 */
  const handleDeleteClick = (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => {
    setDeletingId(id)
    setDeleteInfo({ name, type, parentId })
  }

  /** 确认删除 */
  const handleDeleteConfirm = async () => {
    if (deletingId === null || !deleteInfo) return
    await onDelete(deletingId, deleteInfo.name, deleteInfo.type, deleteInfo.parentId)
    setDeletingId(null)
    setDeleteInfo(null)
  }

  /** 取消删除 */
  const handleDeleteCancel = () => {
    setDeletingId(null)
    setDeleteInfo(null)
  }

  // 可选的父级分类（用于支出分类修改归属）
  const parentOptions = allCategories.filter(
    (c) => c.type === tab && c.parent_id === null
  )

  return (
    <section className="bg-gray-50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">分类管理</h3>

      {/* 收支 Tab 切换 */}
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
                {/* 展开/折叠按钮（仅支出且有子分类时显示） */}
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
                  /* ---- 编辑模式 ---- */
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
                  /* ---- 删除确认模式 ---- */
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
                  /* ---- 展示模式 ---- */
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

              {/* 展开的二级分类列表（仅支出） */}
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
                            /* ---- 子分类编辑模式 ---- */
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
                            /* ---- 子分类删除确认 ---- */
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
                            /* ---- 子分类展示模式 ---- */
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
          {/* 支出分类可选择父级 */}
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
