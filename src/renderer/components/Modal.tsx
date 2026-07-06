/**
 * 通用弹窗容器
 *
 * 提供居中弹出、半透明遮罩、ESC 关闭等基础能力。
 * 具体内容由子组件（children）决定。
 */

import { useEffect, useCallback, type ReactNode } from 'react'

interface ModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 弹窗标题 */
  title?: string
  /** 弹窗内容 */
  children: ReactNode
  /** 弹窗宽度，默认 400px */
  width?: string
}

export default function Modal({ open, onClose, title, children, width = '420px' }: ModalProps) {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗主体 */}
      <div
        className="relative bg-white rounded-2xl shadow-xl p-6 mx-4 max-h-[85vh] overflow-y-auto"
        style={{ width }}
      >
        {title && (
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
