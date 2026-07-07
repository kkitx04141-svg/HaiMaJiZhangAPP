/**
 * Emoji 图标选择器
 *
 * 在 8×10 的网格中展示 80 个常用 emoji，
 * 点击即可选中，当前选中的 emoji 有蓝色高亮边框。
 */

/** 常用 emoji 列表（8行 × 10列） */
export const EMOJI_GRID = [
  '🍜', '🍱', '🍲', '🍎', '🥂', '☕', '🍔', '🍕', '🍰', '🧋',
  '🚗', '🚌', '🚕', '⛽', '🅿️', '✈️', '🚲', '🚄', '🛵', '🚶',
  '🛒', '👗', '📱', '🧴', '🛋️', '💄', '👟', '💻', '📦', '🎒',
  '🏠', '🔑', '🏦', '💡', '🏢', '🔧', '📶', '🛏️', '🚿', '🧹',
  '💊', '🏥', '💉', '🩺', '🦷', '🏃', '🧘', '💇', '🩹', '😴',
  '🎮', '📚', '🎬', '🏖️', '🐾', '🎨', '🎵', '📷', '🎂', '🎤',
  '🎁', '🧧', '🎀', '👴', '🤝', '💐', '🎉', '👶', '💌', '🙏',
  '💰', '📈', '💼', '📊', '💳', '📮', '🧾', '❓', '⭐', '🔥',
]

interface EmojiPickerProps {
  selected: string
  onSelect: (emoji: string) => void
}

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {EMOJI_GRID.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg
            transition-colors
            ${selected === emoji ? 'bg-primary-100 ring-1 ring-primary-400' : 'hover:bg-gray-100'}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
