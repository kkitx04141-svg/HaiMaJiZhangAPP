/**
 * 数据导出工具
 *
 * 通过 IPC 调用主进程的保存对话框和文件写入能力，
 * 将收支记录导出为 CSV 格式（Excel/WPS 可直接打开）。
 */

import { getExpenses, type ExpenseRecord } from '@/db/expenseRepo'
import { centsToYuan } from '@/utils/formatMoney'

/**
 * 将记录列表转为 CSV 字符串
 * 第一行为表头，后续行为数据
 */
export function recordsToCsv(records: ExpenseRecord[]): string {
  // BOM 头确保 Excel 正确识别 UTF-8 中文
  const header = '﻿日期,类型,一级分类,二级分类,金额(元),备注'
  const rows = records.map((r) => {
    const typeLabel = r.type === 'expense' ? '支出' : '收入'
    const amount = centsToYuan(r.amount)
    // CSV 转义：字段含逗号或双引号时用双引号包裹
    const escape = (s: string) => (s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s)
    return `${r.date},${typeLabel},${escape(r.category_main)},${escape(r.category_sub)},${amount},${escape(r.note)}`
  })
  return [header, ...rows].join('\n')
}

/**
 * 导出全部收支记录为 CSV 文件
 * 弹出系统另存为对话框，用户选择保存位置后写入
 * @returns 是否成功
 */
export async function exportDataAsCsv(): Promise<boolean> {
  try {
    // 1. 从数据库读取全部记录
    const records = await getExpenses()

    if (records.length === 0) {
      alert('暂无记账数据，请先记几笔再导出。')
      return false
    }

    // 2. 生成 CSV 内容
    const csv = recordsToCsv(records)

    // 3. 弹出保存对话框
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const defaultName = `黑马记账-数据导出-${dateStr}.csv`

    const { filePath, canceled } = await window.electronAPI.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
    })

    if (canceled || !filePath) {
      return false
    }

    // 4. 写入文件
    await window.electronAPI.writeFile(filePath, csv)
    return true
  } catch (err) {
    console.error('数据导出失败:', err)
    alert('导出失败，请重试。')
    return false
  }
}
