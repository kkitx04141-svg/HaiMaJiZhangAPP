/**
 * 消费分类体系 —— 预置种子数据
 *
 * 结构：一级大类 → 二级小类
 * 共 8 个一级大类，40 个二级小类
 *
 * ⚠️ 分类数据已迁移到数据库（categories 表），运行时请使用 useCategories() Hook。
 * 本文件仅保留常量定义，作为数据库首次启动时的种子数据参考。
 * 修改预置分类时，请同步更新 src/main/index.ts 中的 seedPresetCategories()。
 */

export interface SubCategory {
  /** 二级小类名称 */
  name: string
  /** 图标（emoji） */
  icon: string
}

export interface MainCategory {
  /** 一级大类名称 */
  name: string
  /** 图标（emoji） */
  icon: string
  /** 包含的二级小类 */
  subCategories: SubCategory[]
}

/** 预置支出分类（仅作为种子数据参考，运行时请使用 useCategories() Hook） */
export const PRESET_EXPENSE_CATEGORIES: MainCategory[] = [
  {
    name: '餐饮饮食',
    icon: '🍜',
    subCategories: [
      { name: '早餐', icon: '🥐' },
      { name: '午餐', icon: '🍱' },
      { name: '晚餐', icon: '🍲' },
      { name: '零食水果', icon: '🍎' },
      { name: '聚餐请客', icon: '🥂' },
      { name: '饮品咖啡', icon: '☕' },
    ],
  },
  {
    name: '交通出行',
    icon: '🚗',
    subCategories: [
      { name: '公共交通', icon: '🚌' },
      { name: '打车网约车', icon: '🚕' },
      { name: '加油充电', icon: '⛽' },
      { name: '停车过路费', icon: '🅿️' },
      { name: '火车飞机', icon: '✈️' },
    ],
  },
  {
    name: '购物消费',
    icon: '🛒',
    subCategories: [
      { name: '服饰鞋包', icon: '👗' },
      { name: '数码电器', icon: '📱' },
      { name: '日用品', icon: '🧴' },
      { name: '家居装饰', icon: '🛋️' },
      { name: '美妆护肤', icon: '💄' },
    ],
  },
  {
    name: '住房居住',
    icon: '🏠',
    subCategories: [
      { name: '房租', icon: '🔑' },
      { name: '房贷', icon: '🏦' },
      { name: '水电燃气', icon: '💡' },
      { name: '物业费', icon: '🏢' },
      { name: '维修维护', icon: '🔧' },
      { name: '网费话费', icon: '📶' },
    ],
  },
  {
    name: '健康医疗',
    icon: '💊',
    subCategories: [
      { name: '看病就医', icon: '🏥' },
      { name: '药品', icon: '💉' },
      { name: '体检保健', icon: '🩺' },
      { name: '牙科眼科', icon: '🦷' },
      { name: '运动健身', icon: '🏃' },
    ],
  },
  {
    name: '文教娱乐',
    icon: '🎮',
    subCategories: [
      { name: '学习进修', icon: '📚' },
      { name: '电影演出', icon: '🎬' },
      { name: '游戏充值', icon: '🎮' },
      { name: '旅游度假', icon: '🏖️' },
      { name: '宠物开销', icon: '🐾' },
      { name: '兴趣爱好', icon: '🎨' },
    ],
  },
  {
    name: '人情社交',
    icon: '🎁',
    subCategories: [
      { name: '红包礼金', icon: '🧧' },
      { name: '礼物赠送', icon: '🎀' },
      { name: '孝敬长辈', icon: '👴' },
      { name: '慈善捐款', icon: '🤝' },
    ],
  },
  {
    name: '其他支出',
    icon: '📦',
    subCategories: [
      { name: '金融服务', icon: '💳' },
      { name: '快递邮政', icon: '📮' },
      { name: '税费', icon: '🧾' },
      { name: '其他杂项', icon: '❓' },
    ],
  },
]

/**
 * 根据一级分类名称获取其下的二级小类列表
 */
export function getSubCategories(mainCategoryName: string): SubCategory[] {
  const category = PRESET_EXPENSE_CATEGORIES.find((c) => c.name === mainCategoryName)
  return category ? category.subCategories : []
}

/**
 * 根据一级和二级分类名称获取分类的 emoji 图标
 */
export function getCategoryIcon(mainCategoryName: string, subCategoryName?: string): string {
  if (subCategoryName) {
    const subCategories = getSubCategories(mainCategoryName)
    const sub = subCategories.find((s) => s.name === subCategoryName)
    if (sub) return sub.icon
  }
  const category = PRESET_EXPENSE_CATEGORIES.find((c) => c.name === mainCategoryName)
  return category ? category.icon : '💰'
}

/**
 * 获取所有一级分类名称列表
 */
export function getMainCategoryNames(): string[] {
  return PRESET_EXPENSE_CATEGORIES.map((c) => c.name)
}

// ==================== 收入分类 ====================

/** 收入分类项 */
export interface IncomeCategory {
  name: string
  icon: string
}

/** 预置收入分类（仅作为种子数据参考，运行时请使用 useCategories() Hook） */
export const PRESET_INCOME_CATEGORIES: IncomeCategory[] = [
  { name: '工资薪水', icon: '💰' },
  { name: '奖金红包', icon: '🎁' },
  { name: '投资理财', icon: '📈' },
  { name: '兼职副业', icon: '💼' },
  { name: '其他收入', icon: '📦' },
]

/**
 * 根据收入分类名称获取图标
 */
export function getIncomeIcon(name: string): string {
  const cat = PRESET_INCOME_CATEGORIES.find((c) => c.name === name)
  return cat ? cat.icon : '💰'
}

/**
 * 获取一条记录的图标（自动判断收支类型）
 * @param type 'expense' 或 'income'
 * @param categoryMain 大类名
 * @param categorySub 小类名（支出才有）
 */
export function getRecordIcon(
  type: 'expense' | 'income',
  categoryMain: string,
  categorySub?: string
): string {
  if (type === 'income') return getIncomeIcon(categoryMain)
  return getCategoryIcon(categoryMain, categorySub)
}

// ==================== 过渡期别名（组件迁移完成后将删除）====================

/**
 * @deprecated 分类数据已迁移到数据库，请使用 useCategories() Hook 获取运行时分类列表。
 *             本常量仅保留用于种子数据参考。
 */
export const CATEGORIES = PRESET_EXPENSE_CATEGORIES

/**
 * @deprecated 分类数据已迁移到数据库，请使用 useCategories() Hook 获取运行时分类列表。
 *             本常量仅保留用于种子数据参考。
 */
export const INCOME_CATEGORIES = PRESET_INCOME_CATEGORIES
