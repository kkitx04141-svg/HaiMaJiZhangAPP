# 黑马记账 — 项目约定与规则

## 项目概述

"黑马记账"是一款跨平台（Windows + Mac）桌面记账应用，帮助用户记录和管理日常消费。

- **应用名称**：黑马记账
- **目标平台**：Windows 10+ / macOS 11+
- **货币单位**：人民币（¥）
- **开发状态**：✅ 全部 5 阶段已完成（记账核心 + 统计图表 + 预算管理 + 收支记账 + 打磨发布）

## 技术栈

| 角色 | 技术 | 说明 |
|------|------|------|
| 桌面容器 | Electron | 提供窗口管理、系统托盘、本地文件读写 |
| 前端框架 | React 18 + TypeScript | 构建用户界面 |
| 构建工具 | Vite | 开发热更新、生产打包 |
| UI 样式 | Tailwind CSS | 原子化 CSS，开发效率高 |
| 图表库 | Recharts | React 生态图表库（饼图/柱状图/折线图） |
| 本地数据库 | sql.js | 嵌入式 SQLite（WASM 实现），无需编译，数据存用户本地 |
| 打包工具 | electron-builder | 生成 Windows .exe 和 Mac .dmg |
| 包管理 | npm | Node.js 包管理器 |

## 核心规则（不可违反）

### ⚠️ 技术决策规则

**用户是非技术背景，无法提供技术方案建议。所有技术层面的决策（选库、选方案、选架构模式等），AI 必须先列出 2-4 个可行方案，向用户解释每个方案的优劣势，由用户做出最终选择。此规则在整个项目期间不可违反。**

适用场景包括但不限于：
- 选择第三方库或工具
- 选择实现方式（多种方案都可行时）
- 架构或设计模式的选择
- UI/UX 方案的取舍
- 性能优化方案的取舍

不适用场景：
- 明显的 bug 修复（只有一种正确做法）
- 代码规范层面的选择（已在本文档中约定）
- 安全问题修复（不存在"可选方案"）

## 代码规范

### 通用规则

- 所有变量、函数、组件使用有意义的英文命名（如 `addExpense`），不允许拼音命名
- 注释和文档使用中文
- 每个函数只做一件事，函数不超过 50 行
- 组件文件不超过 300 行，超过则拆分子组件

### TypeScript 规则

- 所有新代码必须使用 TypeScript
- 禁止使用 `any` 类型（除非有充分理由并加注释说明）
- 接口和类型定义：对象形状优先用 `interface`，联合类型用 `type`
- 函数参数超过 3 个时使用对象参数

### React 规则

- 组件使用函数组件 + Hooks，不使用 Class 组件
- 一个文件只导出一个主要组件
- 状态管理优先使用 React 内置的 `useState` / `useContext`，不随意引入第三方状态管理库（如 Redux、Zustand），除非明确需要

### 样式规则

- 使用 Tailwind CSS，避免手写全局 CSS
- 颜色使用 Tailwind 内置色阶或 CSS 变量，方便后续主题切换
- 窗口最小宽度 800px，界面需支持窗口缩放时正常显示

## 数据规则

- **金额存储**：统一使用"分"（整数）存储在数据库中，避免浮点数精度问题（如 `0.1 + 0.2 = 0.30000000000000004`）
  - 存入：用户输入 25.50 元 → 存储 2550（分）
  - 取出：数据库 2550 → 显示 "25.50" 元
- **日期格式**：统一使用 ISO 8601 格式（`YYYY-MM-DD`），如 `2026-07-02`
- **数据操作**：所有删除操作必须有二次确认弹窗

## 安全规则

- **纯本地应用**：不上传任何用户数据到服务器，不收集任何用户信息
- **数据存储**：所有数据仅存储在用户本地
- 如果将来添加云端备份功能，必须是用户主动手动触发的可选功能，且需明确告知用户数据将被上传

## Git 提交规范

- 提交信息格式：`类型: 简要描述`
- 类型包括：
  - `feat:` — 新功能（如 `feat: 新增记账表单`）
  - `fix:` — 修复 bug（如 `fix: 修复金额显示错误`）
  - `style:` — 样式调整（如 `style: 调整列表间距`）
  - `refactor:` — 代码重构（如 `refactor: 重构分类选择逻辑`）
  - `docs:` — 文档更新（如 `docs: 更新 README`）
- 每次提交只做一件事

## 消费分类体系

- **一级大类 8 个**：餐饮饮食、交通出行、购物消费、住房居住、健康医疗、文教娱乐、人情社交、其他支出
- **二级小类 40 个**：详见 `src/constants/categories.ts`
- 分类数据以常量形式定义在代码中，后续支持用户自定义分类时再迁移到数据库

## 测试规则

- 工具函数（如金额转换、日期格式化）需要写单元测试
- UI 组件优先保证核心功能正确，测试为次要

## 目录结构

```
HeiMa-JiZhangApp/
├── CLAUDE.md                    # 项目说明书（本文件）
├── package.json                 # 项目依赖和脚本
├── tsconfig.json                # TypeScript 配置
├── electron.vite.config.ts      # Electron-Vite 构建配置
├── electron-builder.yml         # 打包配置
├── tailwind.config.js           # Tailwind CSS 配置
├── scripts/
│   └── dev.js                   # 开发启动脚本（清除 ELECTRON_RUN_AS_NODE）
├── dist/                        # 打包输出目录
│   ├── heima-accounting-*-setup-win.exe  # Windows 安装程序
│   └── win-unpacked/            # 未打包的可运行目录
├── src/
│   ├── main/
│   │   └── index.ts             # Electron 主进程（创建窗口+数据库+IPC）
│   ├── preload/
│   │   └── index.ts             # 预加载脚本（安全桥接）
│   └── renderer/                # React 渲染进程（界面代码）
│       ├── index.html           # HTML 入口
│       ├── main.tsx             # React 入口
│       ├── App.tsx              # 根组件（左右分栏布局）
│       ├── env.d.ts             # TypeScript 类型声明
│       ├── assets/
│       │   └── main.css         # Tailwind CSS 入口
│       ├── constants/
│       │   └── categories.ts    # 消费分类 + 收入分类数据
│       ├── db/
│       │   ├── expenseRepo.ts   # 收支记录 CRUD + 统计查询
│       │   └── budgetRepo.ts    # 预算 CRUD
│       ├── hooks/
│       │   ├── useExpenses.ts   # 收支数据 Hook
│       │   ├── useStatistics.ts # 统计数据 Hook
│       │   └── useBudget.ts     # 预算数据 Hook
│       ├── components/
│       │   ├── Sidebar.tsx      # 左侧导航
│       │   ├── Modal.tsx        # 通用弹窗
│       │   ├── ExpenseForm.tsx  # 记账表单（支持收支切换）
│       │   └── ExpenseList.tsx  # 账单列表（收支不同颜色）
│       ├── pages/
│       │   ├── HomePage.tsx     # 首页（月份+预算+筛选+列表+FAB）
│       │   ├── StatisticsPage.tsx # 统计页（摘要+饼图+柱状图）
│       │   └── SettingsPage.tsx # 设置页（预算+数据导出）
│       └── utils/
│           ├── formatMoney.ts   # 金额格式化
│           ├── formatDate.ts    # 日期格式化
│           └── exportData.ts    # CSV 数据导出
```

## 已知问题与解决

### ELECTRON_RUN_AS_NODE 环境变量

部分开发环境（如 VS Code 终端）会自动设置 `ELECTRON_RUN_AS_NODE=1`，导致 Electron 以纯 Node.js 模式运行，`require('electron')` 返回路径字符串而非 API 对象。

**解决方法**：`scripts/dev.js` 会在启动前自动清除该环境变量。如果直接运行 `electron` 命令前，请确保该变量未设置。
- 检查：`echo $ELECTRON_RUN_AS_NODE`
- 清除：`unset ELECTRON_RUN_AS_NODE`（bash）或 `set ELECTRON_RUN_AS_NODE=`（cmd）

### 代码签名

个人项目不购买代码签名证书，打包时设置 `CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过签名（已在 package.json 的打包命令中配置）。

### 打包命令

- Windows：`npm run package:win` → 生成 `dist/heima-accounting-1.0.0-setup-win.exe`
- Mac：`npm run package:mac`（需要在 Mac 上执行）
- 安装程序使用默认 Electron 图标，替换图标需在 `build/` 目录放置 `icon.png`（≥256×256）
