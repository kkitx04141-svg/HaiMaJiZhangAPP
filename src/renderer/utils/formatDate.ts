/**
 * 日期格式化工具
 *
 * 存储规则：统一使用 ISO 8601 格式（YYYY-MM-DD）
 * 显示规则：展示给用户时使用中文友好格式
 */

/**
 * 获取今天的日期字符串
 * 例：getToday() → "2026-07-06"
 */
export function getToday(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取当前月份的字符串
 * 例：getCurrentMonth() → "2026-07"
 */
export function getCurrentMonth(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 格式化日期为友好的中文显示
 * 今天的日期显示"今天"，昨天显示"昨天"，其余显示"X月X日"
 */
export function getDateLabel(dateStr: string): string {
  const today = getToday()

  // 计算昨天的日期
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatYMD(yesterday)

  if (dateStr === today) return '今天'
  if (dateStr === yesterdayStr) return '昨天'

  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 格式化月份为友好的中文显示
 * 例："2026-07" → "2026年7月"
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  return `${year}年${parseInt(month, 10)}月`
}

/**
 * 内部工具：将 Date 对象转为 YYYY-MM-DD 字符串
 */
function formatYMD(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
