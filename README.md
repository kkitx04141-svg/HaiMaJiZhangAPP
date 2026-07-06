# 黑马记账 🐴

跨平台桌面记账应用，支持 Windows 和 macOS。

## 功能

- **收支记录**：记录日常支出和收入，支持两级分类（8 大类 41 小类支出 + 5 种收入）
- **统计图表**：分类占比饼图、月度收支趋势柱状图
- **预算管理**：设置月总预算和分类预算，实时进度条
- **自定义分类**：用户可在设置页新增、修改、删除分类，内置 emoji 图标选择器
- **CSV 导出**：一键导出数据到 CSV 文件

## 运行

```bash
# 安装依赖
npm install

# 启动开发模式
npm run dev

# 编译
npm run build

# 打包 Windows 安装程序
npm run package:win
```

## 技术栈

| 角色 | 技术 |
|------|------|
| 桌面容器 | Electron |
| 前端 | React 18 + TypeScript |
| 构建 | electron-vite |
| 样式 | Tailwind CSS |
| 图表 | Recharts |
| 数据库 | sql.js（SQLite，数据存本地） |
| 打包 | electron-builder |

## 隐私说明

本应用完全离线运行，所有数据仅存储在用户本地，不上传任何数据到服务器。

## License

MIT
