/**
 * 记账表单组件
 *
 * 在弹窗中渲染，支持支出和收入两种类型：
 * - 顶部：支出 / 收入 切换标签
 * - 金额输入（用户输入"元"，内部转为"分"存储）
 * - 分类选择（支出：两级联动；收入：一级扁平）
 * - 日期选择（默认今天）
 * - 备注输入（选填）
 */

import { useState, type FormEvent } from 'react'
import {
  useCategories,
  type MainCategoryItem,
  type IncomeCategoryItem,
} from '@/hooks/useCategories'
import { yuanToCents } from '@/utils/formatMoney'
import { getToday } from '@/utils/formatDate'
import type { RecordType } from '@/db/expenseRepo'

/** 备注输入框最大字符数 */
const NOTE_MAX_LENGTH = 50

interface ExpenseFormProps {
  /** 保存回调，传入填好的数据 */
  onSave: (data: {
    amount: number
    category_main: string
    category_sub: string
    date: string
    note: string
    type: RecordType
  }) => void
  /** 取消回调 */
  onCancel: () => void
}

export default function ExpenseForm({ onSave, onCancel }: ExpenseFormProps) {
  // 从 Hook 获取分类数据（替代旧的 import 常量）
  const { expenseCategories, incomeCategories } = useCategories()

  // 类型切换
  const [recordType, setRecordType] = useState<RecordType>('expense')

  // 表单状态
  const [amountText, setAmountText] = useState('')
  const [selectedMain, setSelectedMain] = useState('')
  const [selectedSub, setSelectedSub] = useState('')
  const [date, setDate] = useState(getToday())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isExpense = recordType === 'expense'

  // 当前选中的大类对象（支出时才有子分类）
  const mainCategory: MainCategoryItem | undefined = isExpense
    ? expenseCategories.find((c) => c.name === selectedMain)
    : undefined

  // 当前选中的收入分类对象
  const incomeCategory: IncomeCategoryItem | undefined = !isExpense
    ? incomeCategories.find((c) => c.name === selectedMain)
    : undefined

  // 选择大类时清空前一个小类（收入时大类即最终分类）
  const handleMainChange = (name: string) => {
    setSelectedMain(name)
    if (isExpense) {
      setSelectedSub('')
    }
  }

  // 切换类型时重置分类选择
  const handleTypeChange = (type: RecordType) => {
    setRecordType(type)
    setSelectedMain('')
    setSelectedSub('')
  }

  // 提交表单
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 校验金额
    const amountNum = parseFloat(amountText)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('请输入有效的金额')
      return
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
      setError('金额最多两位小数')
      return
    }

    // 校验分类
    if (!selectedMain) {
      setError(isExpense ? '请选择支出分类' : '请选择收入分类')
      return
    }
    if (isExpense && !selectedSub) {
      setError('请选择二级分类')
      return
    }

    // 校验日期
    if (!date) {
      setError('请选择日期')
      return
    }

    onSave({
      amount: yuanToCents(amountNum),
      category_main: selectedMain,
      category_sub: isExpense ? selectedSub : selectedMain,
      date,
      note: note.trim(),
      type: recordType,
    })
  }

  const title = isExpense ? '记一笔支出' : '记一笔收入'
  const typeColor = isExpense ? 'bg-red-500' : 'bg-green-500'
  const accentColor = isExpense ? 'text-red-500' : 'text-green-500'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ======== 支出 / 收入 切换 ======== */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => handleTypeChange('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
            ${isExpense
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          支出
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange('income')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all
            ${!isExpense
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          收入
        </button>
      </div>

      {/* ======== 金额输入 ======== */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">
          金额（元）
        </label>
        <div className="relative">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xl font-medium ${accentColor}`}>
            {isExpense ? '-' : '+'}¥
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="w-full pl-12 pr-4 py-3 text-2xl font-bold text-gray-900
                       bg-gray-50 rounded-xl border-2 border-transparent
                       focus:bg-white focus:border-primary-400 focus:outline-none
                       placeholder:text-gray-300 transition-colors"
          />
        </div>
      </div>

      {/* ======== 分类选择 ======== */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1.5">
          分类
        </label>

        {isExpense ? (
          <>
            {/* --- 支出一级大类 --- */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {expenseCategories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleMainChange(cat.name)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs
                    transition-colors border-2
                    ${selectedMain === cat.name
                      ? 'bg-red-50 border-red-400 text-red-700'
                      : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* --- 支出二级小类 --- */}
            {mainCategory && (
              <div className="flex flex-wrap gap-2 transition-opacity">
                {mainCategory.subCategories.map((sub) => (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => setSelectedSub(sub.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                      transition-colors border
                      ${selectedSub === sub.name
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                  >
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* --- 收入分类（扁平列表） --- */
          <div className="grid grid-cols-3 gap-2">
            {incomeCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleMainChange(cat.name)}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm
                  transition-colors border-2
                  ${selectedMain === cat.name
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ======== 日期 + 备注 ======== */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
            className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl
                       border-2 border-transparent focus:bg-white
                       focus:border-primary-400 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">
            备注
            <span className="text-gray-400 font-normal ml-1">选填</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isExpense ? '如：食堂午餐' : '如：工资到账'}
            maxLength={NOTE_MAX_LENGTH}
            className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl
                       border-2 border-transparent focus:bg-white
                       focus:border-primary-400 focus:outline-none
                       placeholder:text-gray-300 transition-colors"
          />
        </div>
      </div>

      {/* ======== 错误提示 ======== */}
      {error && (
        <p className="text-sm text-red-500 -mt-2">{error}</p>
      )}

      {/* ======== 按钮组 ======== */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium
                     bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className={`flex-[2] py-2.5 rounded-xl text-sm font-medium text-white
                     transition-colors shadow-sm
                     ${isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          保存
        </button>
      </div>
    </form>
  )
}
