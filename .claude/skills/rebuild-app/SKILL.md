---
name: rebuild-app
description: 重新打包黑马记账应用，生成安装程序（.exe / .dmg）。当用户提到"重新打包"、"构建应用"、"生成安装包"、"打包应用"、"rebuild"、"build app"、"package"时使用。
---

# 重新打包应用

将"黑马记账"重新编译并打包为可安装的桌面应用。

## 这是什么

`npm run package:win`（Windows）或 `npm run package:mac`（Mac）会做三件事：

1. **编译检查**：`electron-vite build` — TypeScript 类型检查 + Vite 打包，输出到 `out/`
2. **打包**：`electron-builder` — 将编译产物 + Electron 运行时打包为安装程序
3. **输出**：生成 `.exe`（Windows）或 `.dmg`（Mac）到 `dist/` 目录

整个过程通常需要 **1-3 分钟**。

## 工作流程

### 第一步：确认打包目标

当前环境是 **Windows**，执行 Windows 打包。

如果用户明确说"打 Mac 包"，需要提醒：Mac 打包只能在 macOS 上执行，当前环境无法完成。

### 第二步：检查依赖

检查 `node_modules` 目录是否存在，不存在则先执行：

```bash
npm install
```

### 第三步：清理旧打包文件

打包前先检查 `dist/` 目录下是否已有旧的打包产物，有则删除：

**Windows：**
```bash
rm -f "d:/Vibe Coding/HeiMa-JiZhangApp/dist/"*.exe
```

**Mac：**
```bash
rm -f "dist/"*.dmg
```

同时也清理编译缓存 `out/`，确保是从干净状态重新打包：
```bash
rm -rf "d:/Vibe Coding/HeiMa-JiZhangApp/dist"
rm -rf "d:/Vibe Coding/HeiMa-JiZhangApp/out"
```

清理完成后告知用户："已清理旧的打包文件，开始重新打包..."

### 第四步：执行打包

**Windows（默认）：**
```bash
npm run package:win
```

**Mac（仅在 macOS 上）：**
```bash
npm run package:mac
```

打包命令内部已经包含了编译步骤，不需要先手动 `npm run build`。

### 第五步：确认结果

打包成功后的输出位置：

- **Windows**：`dist/heima-accounting-1.0.0-setup-win.exe`
- **Mac**：`dist/heima-accounting-1.0.0-mac.dmg`

成功标志：
- 终端没有报错
- `dist/` 目录下生成了对应的安装文件
- 文件大小通常在 50-100 MB 左右（包含 Electron 运行时）

## 常见问题

### 问题一：打包时间很长或卡住

首次打包需要下载 Electron 二进制文件（约 80 MB），下载慢时考虑：
- 确认代理软件已开启
- 检查 `ELECTRON_MIRROR` 环境变量是否指向国内镜像

### 问题二：报错 "Cannot find module" 或编译失败

说明源码有 TypeScript 类型错误。先查看终端日志定位出错的源文件和行号，修复后再重试。

### 问题三：签名相关报错

个人项目不购买代码签名证书。`package.json` 的打包命令中已配置 `CSC_IDENTITY_AUTO_DISCOVERY=false` 跳过签名，如果仍然报签名错误，检查该环境变量是否生效。

### 问题四：打包成功但安装后无法运行

- 先用 `npm run dev` 在开发模式确认应用本身没问题
- 检查 `electron-builder.yml` 配置是否被误改
- 看 `dist/win-unpacked/` 目录下直接运行 exe 是否有报错

### 问题五：磁盘空间不足

安装程序约 80 MB，打包过程需要额外临时空间。确保磁盘有至少 500 MB 空闲空间。
