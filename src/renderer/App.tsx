/**
 * 根组件 —— 左右分栏布局
 *
 * 左侧：Sidebar 导航（记账 / 统计 / 设置）
 * 右侧：对应当前 Tab 的内容页
 */

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import HomePage from '@/pages/HomePage'
import StatisticsPage from '@/pages/StatisticsPage'
import SettingsPage from '@/pages/SettingsPage'

type TabKey = 'home' | 'stats' | 'settings'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home')

  /** 渲染右侧内容区 */
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />
      case 'stats':
        return <StatisticsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={(key) => setActiveTab(key as TabKey)} />
      <main className="flex-1 flex flex-col relative bg-white rounded-tl-2xl overflow-hidden ml-0">
        {renderContent()}
      </main>
    </div>
  )
}
