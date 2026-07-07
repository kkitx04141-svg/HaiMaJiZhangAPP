/**
 * React 渲染进程入口 —— 挂载根组件 App 到页面
 *
 * 这是整个应用的起点：React 从这里接管页面上的 <div id="root">，
 * 之后所有 UI 都由 React 组件树来渲染。
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/assets/main.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
