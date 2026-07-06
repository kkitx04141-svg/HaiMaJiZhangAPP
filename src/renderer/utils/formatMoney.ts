/**
 * 金额格式化工具
 *
 * 存储规则：统一使用"分"（整数）存储在数据库中
 * 显示规则：展示给用户时转换为"元"（保留两位小数）
 */

/**
 * 分 → 元（用于显示）
 * 例：2550 → "25.50"
 */
export function centsToYuan(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * 元 → 分（用于存储）
 * 例：25.5 → 2550
 */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100)
}
