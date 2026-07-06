/**
 * 统计页面
 *
 * 页面结构：
 * - 月份选择器
 * - 三个摘要卡片（总支出 / 总收入 / 结余）
 * - 分类占比饼图（仅支出） + 月度趋势柱状图（支出 vs 收入）
 */

import { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useStatistics } from '@/hooks/useStatistics'
import { getCurrentMonth, formatMonth } from '@/utils/formatDate'
import { centsToYuan } from '@/utils/formatMoney'
import { useCategories } from '@/hooks/useCategories'

// 饼图颜色
const PIE_COLORS = [
  '#3b82f6', '#f59e0b', '#ef4444', '#22c55e',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1',
]

export default function StatisticsPage() {
  const { categoryStats, monthlyTrends, monthSummary, loading, refresh } = useStatistics()
  const { expenseCategories } = useCategories()
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth())

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

  useEffect(() => {
    refresh(currentMonth)
  }, [currentMonth, refresh])

  const canGoNext = currentMonth < getCurrentMonth()

  // 饼图数据（支出分类占比）
  const pieData = categoryStats.map((s) => ({
    name: s.category_main,
    value: s.total,
    icon: expenseCategories.find((c) => c.name === s.category_main)?.icon || '💰',
  }))

  // 柱状图数据（月度收支对比）
  const barData = monthlyTrends.map((t) => ({
    month: formatMonth(t.month).replace('年', '/').replace('月', ''),
    expense: t.expense,
    income: t.income,
    fullMonth: t.month,
  }))

  const hasData = monthSummary.count > 0

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

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <span className="animate-pulse">加载中…</span>
          </div>
        ) : (
          <>
            {/* 摘要卡片 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <SummaryCard
                label="总支出"
                value={hasData ? `¥${centsToYuan(monthSummary.expense)}` : '--'}
                icon="📤"
                color="text-expense"
              />
              <SummaryCard
                label="总收入"
                value={hasData ? `¥${centsToYuan(monthSummary.income)}` : '--'}
                icon="📥"
                color="text-income"
              />
              <SummaryCard
                label="结余"
                value={hasData
                  ? `${monthSummary.balance >= 0 ? '+' : ''}¥${centsToYuan(monthSummary.balance)}`
                  : '--'}
                icon="💵"
                color={monthSummary.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}
              />
            </div>

            {/* 图表区 */}
            {hasData ? (
              <div className="grid grid-cols-2 gap-6">
                {/* 饼图 — 支出分类占比 */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">支出分类占比</h3>
                  {pieData.length > 0 ? (
                    <CategoryPieChart data={pieData} />
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-10">本月无支出</p>
                  )}
                </div>

                {/* 柱状图 — 月度收支趋势 */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">月度收支趋势</h3>
                  <MonthlyBarChart data={barData} activeMonth={currentMonth} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-4">📊</span>
                <p className="text-sm">这个月还没有记账数据</p>
                <p className="text-xs mt-1 text-gray-300">去"记账"Tab 添加记录吧</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ==================== 子组件 ====================

/** 摘要卡片 */
function SummaryCard({
  label, value, icon, color,
}: {
  label: string; value: string; icon: string; color: string
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center">
      <span className="text-2xl">{icon}</span>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

/** 分类饼图 */
function CategoryPieChart({ data }: { data: Array<{ name: string; value: number; icon: string }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [
            `¥${centsToYuan(value)} (${((value / total) * 100).toFixed(1)}%)`,
            '',
          ]}
          contentStyle={{
            borderRadius: '12px', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** 月度收支趋势柱状图 */
function MonthlyBarChart({
  data, activeMonth,
}: {
  data: Array<{ month: string; expense: number; income: number; fullMonth: string }>
  activeMonth: string
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v: number) => `¥${(v / 100).toFixed(0)}`}
        />
        <Tooltip
          formatter={(value: number) => [`¥${centsToYuan(value)}`, '']}
          contentStyle={{
            borderRadius: '12px', border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '13px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Bar dataKey="expense" name="支出" radius={[6, 6, 0, 0]} maxBarSize={24} fill="#ef4444" />
        <Bar dataKey="income" name="收入" radius={[6, 6, 0, 0]} maxBarSize={24} fill="#22c55e" />
      </BarChart>
    </ResponsiveContainer>
  )
}
