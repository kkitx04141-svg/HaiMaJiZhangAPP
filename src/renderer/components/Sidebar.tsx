/**
 * 左侧导航栏
 *
 * 垂直排列的 Tab 按钮列表，点击后在右侧切换对应内容。
 * 当前有三个 Tab：记账、统计、设置。
 */

interface TabItem {
  key: string
  label: string
  icon: string
}

const TABS: TabItem[] = [
  { key: 'home', label: '记账', icon: '📝' },
  { key: 'stats', label: '统计', icon: '📊' },
  { key: 'settings', label: '设置', icon: '⚙️' },
]

interface SidebarProps {
  /** 当前激活的 Tab */
  activeTab: string
  /** Tab 切换回调 */
  onTabChange: (key: string) => void
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col py-6">
      {/* 应用标题 */}
      <div className="px-5 mb-8">
        <h1 className="text-lg font-bold text-primary-600 tracking-wide">黑马记账</h1>
      </div>

      {/* Tab 列表 */}
      <ul className="flex flex-col gap-1 px-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <li key={tab.key}>
              <button
                onClick={() => onTabChange(tab.key)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
