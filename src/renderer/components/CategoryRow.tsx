/**
 * 分类行组件
 *
 * 处理一个分类行（一级或二级）的三种显示模式：
 * - 展示模式：图标 + 名称 + 编辑/删除按钮（预置分类不显示按钮）
 * - 编辑模式：图标选择 + 归属选择 + 名称输入 + 保存/取消
 * - 删除确认模式：确认删除？+ 确认/取消
 */

import EmojiPicker, { EMOJI_GRID } from './EmojiPicker'

/** 分类记录基础形状 */
interface CategoryRecord {
  id: number
  name: string
  icon: string
  parent_id: number | null
  type: string
  is_preset: number
}

interface CategoryRowProps {
  cat: { id: number; name: string; icon: string; is_preset: number }
  isEditing: boolean
  isDeleting: boolean
  isExpense: boolean
  isPreset: boolean
  isExpanded?: boolean
  hasSubCategories?: boolean
  editName: string
  editIcon: string
  editParentId: number | null
  showEditEmojiGrid: boolean
  parentOptions: CategoryRecord[]
  editingId: number | null
  isSubCategory?: boolean
  parentId?: number | null
  onToggleExpand?: (id: number) => void
  onStartEdit: (id: number, name: string, icon: string, parentId?: number | null) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteClick: (id: number, name: string, type?: 'expense' | 'income', parentId?: number | null) => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  onSetEditName: (v: string) => void
  onSetEditIcon: (v: string) => void
  onSetEditParentId: (v: number | null) => void
  onToggleEditEmojiGrid: () => void
}

export default function CategoryRow({
  cat, isEditing, isDeleting, isExpense, isPreset,
  isExpanded, hasSubCategories, editName, editIcon, editParentId,
  showEditEmojiGrid, parentOptions, editingId, parentId, isSubCategory,
  onToggleExpand, onStartEdit, onSaveEdit, onCancelEdit,
  onDeleteClick, onDeleteConfirm, onDeleteCancel,
  onSetEditName, onSetEditIcon, onSetEditParentId, onToggleEditEmojiGrid,
}: CategoryRowProps) {
  const iconSize = isSubCategory ? 'text-base' : 'text-lg'
  const buttonSize = isSubCategory ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors
        ${isDeleting ? 'bg-red-50' : isSubCategory ? 'bg-white/70' : 'bg-white'}`}
    >
      {/* 展开/折叠按钮（仅一级支出分类且有子分类时显示） */}
      {!isSubCategory && isExpense && hasSubCategories && onToggleExpand && (
        <button
          onClick={() => onToggleExpand(cat.id)}
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xs"
        >
          {isExpanded ? '▾' : '▸'}
        </button>
      )}
      {!isSubCategory && (!isExpense || !hasSubCategories) && <span className="w-5" />}

      {isEditing ? (
        /* ---- 编辑模式：图标选择 + 归属选择 + 名称 + 保存/取消 ---- */
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onToggleEditEmojiGrid}
              className="w-8 h-8 flex items-center justify-center text-lg border rounded-lg
                         hover:bg-gray-50 transition-colors shrink-0"
              title="点击选择图标"
            >
              {editIcon}
            </button>
            {/* 支出分类可改归属到其他一级分类 */}
            {isExpense && (
              <select
                value={editParentId ?? ''}
                onChange={(e) => onSetEditParentId(e.target.value ? Number(e.target.value) : null)}
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
              onChange={(e) => onSetEditName(e.target.value)}
              className="flex-1 min-w-[80px] px-2 py-1 text-sm border rounded-lg focus:outline-none focus:border-primary-400"
              autoFocus
            />
            <button
              onClick={onSaveEdit}
              className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
            >
              保存
            </button>
            <button
              onClick={onCancelEdit}
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
                  onClick={() => onSetEditIcon(emoji)}
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
          <span className={iconSize}>{cat.icon}</span>
          <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
          <span className="text-xs text-red-500">确认删除？</span>
          <button
            onClick={onDeleteConfirm}
            className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
          >
            确认
          </button>
          <button
            onClick={onDeleteCancel}
            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
          >
            取消
          </button>
        </>
      ) : (
        /* ---- 展示模式：图标 + 名称 + 操作按钮 ---- */
        <>
          <span className={iconSize}>{cat.icon}</span>
          <span className="flex-1 text-sm text-gray-700">{cat.name}</span>
          {isPreset ? (
            <span className="text-xs text-gray-300">预置</span>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => onStartEdit(cat.id, cat.name, cat.icon, parentId ?? null)}
                className={`${buttonSize} flex items-center justify-center rounded text-gray-400 hover:text-primary-600 hover:bg-gray-100 text-xs`}
                title="编辑"
              >
                ✏️
              </button>
              <button
                onClick={() => onDeleteClick(cat.id, cat.name)}
                className={`${buttonSize} flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-gray-100 text-xs`}
                title="删除"
              >
                🗑️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
