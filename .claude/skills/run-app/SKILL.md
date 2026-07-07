---
name: run-app
description: 启动黑马记账应用（开发模式）用于预览或测试。当用户提到"启动应用"、"运行应用"、"打开应用"、"run app"、"start app"、"跑起来"时使用。
---

# 启动应用

启动"黑马记账"桌面应用（Electron + React 开发模式）。

## 什么是"启动应用"

执行 `npm run dev`，它会：
1. 清除 `ELECTRON_RUN_AS_NODE` 环境变量（这个变量会导致 Electron 无法正常启动）
2. 用 electron-vite 编译 TypeScript + 打包前端资源
3. 启动 Electron 窗口，加载应用界面

## 工作流程

### 第一步：检查依赖

检查 `node_modules` 目录是否存在。如果不存在，说明依赖还没安装，需要先跑：

```bash
npm install
```

安装完成后再继续下一步。

如果 `npm install` 访问外网失败，按以下顺序排查：
- 代理软件是否已开启
- 代理端口是否正确
- 环境变量是否已在当前终端设置

### 第二步：启动应用

```bash
npm run dev
```

这个命令不会自动退出——它会持续运行，终端会显示 electron-vite 的编译日志。Electron 应用窗口会独立弹出。

### 第三步：确认启动成功

启动成功的标志：
- 终端出现 `dev server running at` 之类的字样
- 系统弹出一个独立的桌面窗口（黑马记账应用）
- 终端持续输出编译日志，没有报错退出

## 常见问题

### 问题一：报错 "electron: command not found" 或类似错误

说明依赖没装或装得不完整。执行：

```bash
npm install
```

### 问题二：报错包含 "ELECTRON_RUN_AS_NODE"

这个环境变量还在。`scripts/dev.js` 会自动清除它，但如果直接执行 `electron-vite dev` 就不会清除。始终用 `npm run dev` 而不是直接跑 electron-vite。

### 问题三：窗口弹出来但是白屏

检查终端日志是否有编译错误（TypeScript 类型错误、模块找不到等）。修复后再重新启动。

### 问题四：端口被占用

electron-vite 默认使用 5173 端口。如果被占用，杀掉占用进程后重试，或修改配置。

## 停止应用

- 直接关闭 Electron 窗口
- 或在终端按 `Ctrl + C` 终止进程
