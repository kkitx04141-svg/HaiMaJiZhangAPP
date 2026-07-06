/**
 * 分类数据管理 Hook
 *
 * 封装分类的读取、新增、修改、删除逻辑。
 * 组件通过此 Hook 获取分类数据，不再直接 import categories.ts 常量。
 *
 * 返回的 expenseCategories 和 incomeCategories 直接兼容
 * ExpenseForm 原有的结构（MainCategory / IncomeCategory）。
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAllCategories,
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  deleteSubCategories as dbDeleteSubCategories,
  getCategoryUsageCount,
  updateExpenseCategoryRefs,
  type CategoryRecord,
  type CategoryInput,
} from '@/db/categoryRepo'

// ---------- 兼容组件的类型（和旧 categories.ts 接口对齐）----------

export interface SubCategoryItem {
  id: number
  name: string
  icon: string
  is_preset: number
}

export interface MainCategoryItem {
  id: number
  name: string
  icon: string
  is_preset: number
  subCategories: SubCategoryItem[]
}

export interface IncomeCategoryItem {
  id: number
  name: string
  icon: string
  is_preset: number
}

// ---------- Hook ----------

export function useCategories() {
  const [records, setRecords] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(false)

  /** 加载全部分类 */
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllCategories()
      setRecords(data)
    } catch (err) {
      console.error('获取分类数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 首次加载时自动刷新
  useEffect(() => {
    refresh()
  }, [refresh])

  // ---------- 派生数据 ----------

  /** 支出两级结构（兼容旧的 CATEGORIES 格式） */
  const expenseCategories: MainCategoryItem[] = useMemo(() => {
    const mains = records
      .filter((c) => c.type === 'expense' && c.parent_id === null)
      .sort((a, b) => a.sort_order - b.sort_order)

    return mains.map((main) => ({
      id: main.id,
      name: main.name,
      icon: main.icon,
      is_preset: main.is_preset,
      subCategories: records
        .filter((c) => c.parent_id === main.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((sub) => ({
          id: sub.id,
          name: sub.name,
          icon: sub.icon,
          is_preset: sub.is_preset,
        })),
    }))
  }, [records])

  /** 收入扁平列表（兼容旧的 INCOME_CATEGORIES 格式） */
  const incomeCategories: IncomeCategoryItem[] = useMemo(() => {
    return records
      .filter((c) => c.type === 'income' && c.parent_id === null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        is_preset: c.is_preset,
      }))
  }, [records])

  /** 分类名 → 图标的快速查找 Map */
  const iconMap: Map<string, string> = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of records) {
      map.set(r.name, r.icon)
    }
    return map
  }, [records])

  /** 获取一条记录的图标（签名和旧 getRecordIcon 完全相同） */
  const getRecordIcon = useCallback(
    (type: 'expense' | 'income', categoryMain: string, categorySub?: string): string => {
      if (type === 'income') {
        return iconMap.get(categoryMain) || '💰'
      }
      // 支出：优先用二级分类图标，其次一级，兜底 💰
      if (categorySub) {
        const subIcon = iconMap.get(categorySub)
        if (subIcon) return subIcon
      }
      return iconMap.get(categoryMain) || '💰'
    },
    [iconMap]
  )

  // ---------- 写操作 ----------

  /** 新增分类 */
  const addCategory = useCallback(
    async (data: CategoryInput): Promise<number> => {
      const id = await dbAddCategory(data)
      await refresh()
      return id
    },
    [refresh]
  )

  /** 修改分类名称和图标 */
  const updateCategory = useCallback(
    async (id: number, data: { name: string; icon: string; parent_id?: number | null }): Promise<void> => {
      await dbUpdateCategory(id, data)
      await refresh()
    },
    [refresh]
  )

  /**
   * 删除分类（含安全检查）
   *
   * 流程：
   * 1. 查该分类在收支记录中的引用次数
   * 2. 如果 > 0，把受影响记录的分类字段改为"未分类"
   * 3. 如果是一级分类，级联删除所有子分类
   * 4. 删除分类本身
   *
   * @returns 删除前受影响的记录数（0 = 无引用）
   */
  const deleteCategory = useCallback(
    async (id: number, name: string, type: 'expense' | 'income', parentId: number | null): Promise<number> => {
      const usageCount = await getCategoryUsageCount(name, type)

      if (usageCount > 0) {
        // 把引用此分类的记录改为"未分类"
        await updateExpenseCategoryRefs(name, '未分类', type)
      }

      // 级联删除子分类
      if (parentId === null && type === 'expense') {
        await dbDeleteSubCategories(id)
      }

      await dbDeleteCategory(id)
      await refresh()
      return usageCount
    },
    [refresh]
  )

  return {
    records,
    loading,
    refresh,
    expenseCategories,
    incomeCategories,
    iconMap,
    getRecordIcon,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
