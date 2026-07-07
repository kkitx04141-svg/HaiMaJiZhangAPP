/**
 * 分类常量与工具函数 — 单元测试
 */
import { describe, it, expect } from 'vitest'
import {
  getSubCategories,
  getCategoryIcon,
  getMainCategoryNames,
  getIncomeIcon,
  getRecordIcon,
  PRESET_EXPENSE_CATEGORIES,
  PRESET_INCOME_CATEGORIES,
  CATEGORIES,
  INCOME_CATEGORIES,
} from '@/constants/categories'

// ============================================================
// PRESET_EXPENSE_CATEGORIES — 预置支出分类常量
// ============================================================

describe('PRESET_EXPENSE_CATEGORIES — 预置支出分类', () => {
  it('共 8 个一级大类', () => {
    expect(PRESET_EXPENSE_CATEGORIES).toHaveLength(8)
  })

  it('二级小类总计 41 个', () => {
    const total = PRESET_EXPENSE_CATEGORIES.reduce(
      (sum, c) => sum + c.subCategories.length,
      0
    )
    expect(total).toBe(41)
  })

  it('大类名称符合预期顺序', () => {
    const names = PRESET_EXPENSE_CATEGORIES.map((c) => c.name)
    expect(names).toEqual([
      '餐饮饮食', '交通出行', '购物消费', '住房居住',
      '健康医疗', '文教娱乐', '人情社交', '其他支出',
    ])
  })

  it('每个大类至少有一个子分类', () => {
    for (const cat of PRESET_EXPENSE_CATEGORIES) {
      expect(cat.subCategories.length).toBeGreaterThan(0)
    }
  })

  it('每个大类和小类都有 name 和 icon', () => {
    for (const main of PRESET_EXPENSE_CATEGORIES) {
      expect(main.name).toBeTruthy()
      expect(main.icon).toBeTruthy()
      for (const sub of main.subCategories) {
        expect(sub.name).toBeTruthy()
        expect(sub.icon).toBeTruthy()
      }
    }
  })
})

// ============================================================
// getSubCategories
// ============================================================

describe('getSubCategories — 获取二级小类', () => {
  it('传入"餐饮饮食" → 返回 6 个小类', () => {
    const subs = getSubCategories('餐饮饮食')
    expect(subs).toHaveLength(6)
    expect(subs[0].name).toBe('早餐')
  })

  it('传入"人情社交" → 返回 4 个小类', () => {
    const subs = getSubCategories('人情社交')
    expect(subs).toHaveLength(4)
  })

  it('传入不存在的大类名 → 返回空数组', () => {
    const subs = getSubCategories('不存在的分类')
    expect(subs).toEqual([])
  })
})

// ============================================================
// getCategoryIcon
// ============================================================

describe('getCategoryIcon — 获取分类图标', () => {
  it('传入一级+二级分类名 → 返回二级分类的图标', () => {
    const icon = getCategoryIcon('餐饮饮食', '午餐')
    expect(icon).toBe('🍱')
  })

  it('只传一级分类名（不传二级）→ 返回一级分类图标', () => {
    const icon = getCategoryIcon('交通出行')
    expect(icon).toBe('🚗')
  })

  it('传入的二级分类不存在 → 降级返回一级分类图标', () => {
    const icon = getCategoryIcon('餐饮饮食', '不存在的二级')
    expect(icon).toBe('🍜')
  })

  it('传入不存在的一级分类名 → 返回兜底图标 💰', () => {
    const icon = getCategoryIcon('不存在')
    expect(icon).toBe('💰')
  })
})

// ============================================================
// getMainCategoryNames
// ============================================================

describe('getMainCategoryNames — 获取所有一级分类名', () => {
  it('返回 8 个分类名', () => {
    const names = getMainCategoryNames()
    expect(names).toHaveLength(8)
  })

  it('返回值和 PRESET_EXPENSE_CATEGORIES 的 name 对应', () => {
    const names = getMainCategoryNames()
    const expected = PRESET_EXPENSE_CATEGORIES.map((c) => c.name)
    expect(names).toEqual(expected)
  })
})

// ============================================================
// PRESET_INCOME_CATEGORIES — 预置收入分类
// ============================================================

describe('PRESET_INCOME_CATEGORIES — 预置收入分类', () => {
  it('共 5 个收入分类', () => {
    expect(PRESET_INCOME_CATEGORIES).toHaveLength(5)
  })

  it('名称符合预期', () => {
    const names = PRESET_INCOME_CATEGORIES.map((c) => c.name)
    expect(names).toEqual([
      '工资薪水', '奖金红包', '投资理财', '兼职副业', '其他收入',
    ])
  })
})

// ============================================================
// getIncomeIcon
// ============================================================

describe('getIncomeIcon — 获取收入分类图标', () => {
  it('传入"工资薪水" → 返回 💰', () => {
    expect(getIncomeIcon('工资薪水')).toBe('💰')
  })

  it('传入"投资理财" → 返回 📈', () => {
    expect(getIncomeIcon('投资理财')).toBe('📈')
  })

  it('传入不存在的收入分类 → 返回兜底图标 💰', () => {
    expect(getIncomeIcon('不存在的收入')).toBe('💰')
  })
})

// ============================================================
// getRecordIcon
// ============================================================

describe('getRecordIcon — 获取记录的图标（自动判断收支类型）', () => {
  it('支出且有二级分类 → 返回二级图标', () => {
    expect(getRecordIcon('expense', '餐饮饮食', '午餐')).toBe('🍱')
  })

  it('支出且只有一级分类 → 返回一级图标', () => {
    expect(getRecordIcon('expense', '交通出行')).toBe('🚗')
  })

  it('收入类型 → 走收入图标查找', () => {
    expect(getRecordIcon('income', '工资薪水')).toBe('💰')
  })

  it('收入且分类不存在 → 返回兜底图标 💰', () => {
    expect(getRecordIcon('income', '不存在的收入')).toBe('💰')
  })
})

// ============================================================
// 过渡期别名
// ============================================================

describe('CATEGORIES / INCOME_CATEGORIES — 过渡期别名', () => {
  it('CATEGORIES 和 PRESET_EXPENSE_CATEGORIES 是同一个引用', () => {
    expect(CATEGORIES).toBe(PRESET_EXPENSE_CATEGORIES)
  })

  it('INCOME_CATEGORIES 和 PRESET_INCOME_CATEGORIES 是同一个引用', () => {
    expect(INCOME_CATEGORIES).toBe(PRESET_INCOME_CATEGORIES)
  })
})
