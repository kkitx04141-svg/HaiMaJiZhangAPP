/**
 * 分类管理组件
 *
 * 让用户在设置页中管理支出和收入的分类体系：
 * - 支出分类：两级结构（一级大类 → 二级小类），支持展开/折叠
 * - 收入分类：扁平列表（无二级）
 * - 支持新增、修改（名称、图标、归属）、删除分类
 * - 预置分类不可修改或删除（is_preset=1）
 *
 * 子组件：CategoryRow（分类行）、EmojiPicker（图标选择器）
 */

import { useState } from 'react'
import type { MainCategoryItem } from '@/hooks/useCategories'
import CategoryRow from '@/components/CategoryRow'
import EmojiPicker from '@/components/EmojiPicker'

// ==================== 类型定义 ====================

/** 分类原始记录 */
interface CategoryRecord {
  id: number
  name: string
  icon: string
  parent_id: number | null
  type: string
  is_preset: number
}

interface CategoryManagerProps {
  expenseCategories: MainCategoryItem[]
  incomeCategories: { id: number; name: string; icon: string; is_preset: number }[]
  allCategories: CategoryRecord[]
  onAdd: (data: { name: string; icon: string; parent_id: number | null; type: 'expense' | 'income' }) => Promise<number>
  onUpdate: (id: number, data: { name: string; icon: string; parent_id?: number | null }) => Promise<void>
  onDelete: (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => Promise<number>
}

// ==================== 主组件 ====================

export default function CategoryManager({
  expenseCategories, incomeCategories, allCategories,
  onAdd, onUpdate, onDelete,
}: CategoryManagerProps) {
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // --- 编辑状态 ---
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [editParentId, setEditParentId] = useState<number | null>(null)
  const [showEditEmojiGrid, setShowEditEmojiGrid] = useState(false)

  // --- 新增状态 ---
  const [showAddForm, setShowAddForm] = useState(false)
  const [addParentId, setAddParentId] = useState<number | null>(null)
  const [addName, setAddName] = useState('')
  const [addIcon, setAddIcon] = useState('📦')

  // --- 删除确认 ---
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ name: string; type: 'expense' | 'income'; parentId: number | null } | null>(null)

  const isExpense = tab === 'expense'
  const categories = isExpense ? expenseCategories : incomeCategories

  const toggleExpand = (id: number) => setExpandedIds((prev) => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleStartEdit = (id: number, name: string, icon: string, parentId: number | null = null) => {
    setEditingId(id); setEditName(name); setEditIcon(icon); setEditParentId(parentId)
  }

  const handleCancelEdit = () => {
    setEditingId(null); setEditName(''); setEditIcon(''); setEditParentId(null); setShowEditEmojiGrid(false)
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || editingId === null) return
    await onUpdate(editingId, { name: editName.trim(), icon: editIcon || '💰', parent_id: isExpense ? editParentId : undefined })
    handleCancelEdit()
  }

  const handleAdd = async () => {
    if (!addName.trim()) return
    await onAdd({ name: addName.trim(), icon: addIcon || '💰', parent_id: addParentId, type: tab })
    setShowAddForm(false); setAddName(''); setAddIcon('📦'); setAddParentId(null)
  }

  const handleDeleteClick = (id: number, name: string, type: 'expense' | 'income', parentId: number | null) => {
    setDeletingId(id); setDeleteInfo({ name, type, parentId })
  }

  const handleDeleteConfirm = async () => {
    if (deletingId === null || !deleteInfo) return
    await onDelete(deletingId, deleteInfo.name, deleteInfo.type, deleteInfo.parentId)
    setDeletingId(null); setDeleteInfo(null)
  }

  const handleDeleteCancel = () => { setDeletingId(null); setDeleteInfo(null) }

  const parentOptions = allCategories.filter((c) => c.type === tab && c.parent_id === null)

  return (
    <section className="bg-gray-50 rounded-2xl p-5">
      <h3 className="text-sm font-medium text-gray-700 mb-4">分类管理</h3>

      {/* 收支 Tab 切换 */}
      <div className="flex bg-gray-200 rounded-lg p-0.5 mb-4 w-fit">
        <button onClick={() => setTab('expense')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${isExpense ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          支出分类
        </button>
        <button onClick={() => setTab('income')}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${!isExpense ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          收入分类
        </button>
      </div>

      {/* 分类列表 */}
      <ul className="space-y-1 mb-4">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id
          const isDeleting = deletingId === cat.id
          const subCategories = isExpense && 'subCategories' in cat ? (cat as MainCategoryItem).subCategories : []
          return (
            <li key={cat.id}>
              <CategoryRow
                cat={cat} isEditing={isEditing} isDeleting={isDeleting}
                isExpense={isExpense} isPreset={cat.is_preset === 1}
                isExpanded={expandedIds.has(cat.id)} hasSubCategories={subCategories.length > 0}
                editName={editName} editIcon={editIcon} editParentId={editParentId}
                showEditEmojiGrid={showEditEmojiGrid} parentOptions={parentOptions} editingId={editingId}
                onToggleExpand={toggleExpand} onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit}
                onDeleteClick={handleDeleteClick} onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={handleDeleteCancel}
                onSetEditName={setEditName} onSetEditIcon={setEditIcon}
                onSetEditParentId={setEditParentId}
                onToggleEditEmojiGrid={() => setShowEditEmojiGrid(!showEditEmojiGrid)}
              />
              {/* 展开的二级分类 */}
              {isExpense && expandedIds.has(cat.id) && subCategories.length > 0 && (
                <ul className="ml-7 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-4">
                  {subCategories.map((sub) => (
                    <li key={sub.id}>
                      <CategoryRow
                        cat={sub} isEditing={editingId === sub.id} isDeleting={deletingId === sub.id}
                        isExpense={isExpense} isPreset={sub.is_preset === 1} isSubCategory
                        editName={editName} editIcon={editIcon} editParentId={editParentId}
                        showEditEmojiGrid={showEditEmojiGrid} parentOptions={parentOptions} editingId={editingId}
                        parentId={cat.id}
                        onStartEdit={(id, name, icon) => handleStartEdit(id, name, icon, cat.id)}
                        onSaveEdit={handleSaveEdit} onCancelEdit={handleCancelEdit}
                        onDeleteClick={(id, name) => handleDeleteClick(id, name, tab, cat.id)}
                        onDeleteConfirm={handleDeleteConfirm} onDeleteCancel={handleDeleteCancel}
                        onSetEditName={setEditName} onSetEditIcon={setEditIcon}
                        onSetEditParentId={setEditParentId}
                        onToggleEditEmojiGrid={() => setShowEditEmojiGrid(!showEditEmojiGrid)}
                      />
                    </li>
                  ))}
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
              <select value={addParentId ?? ''}
                onChange={(e) => setAddParentId(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 px-2 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400">
                <option value="">一级分类</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-14">名称</label>
            <input value={addName} onChange={(e) => setAddName(e.target.value)}
              placeholder={isExpense ? '如：宠物开销' : '如：退款'}
              className="flex-1 px-2 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-primary-400"
              autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              图标：<span className="text-lg ml-1">{addIcon}</span>
            </label>
            <EmojiPicker selected={addIcon} onSelect={setAddIcon} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleAdd} disabled={!addName.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors">
              添加
            </button>
            <button onClick={() => { setShowAddForm(false); setAddName(''); setAddIcon('📦'); setAddParentId(null) }}
              className="px-4 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              取消
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)}
          className="text-sm px-4 py-2 rounded-xl bg-white border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
          + 新增分类
        </button>
      )}

      <p className="text-xs text-gray-400 mt-3">
        预置分类不可修改或删除。删除自定义分类时，相关收支记录的分类将显示为"未分类"。
      </p>
    </section>
  )
}
