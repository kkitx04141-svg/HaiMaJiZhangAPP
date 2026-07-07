---
name: security-audit
description: 代码安全审计。检查敏感信息泄露、SQL 注入、配置安全、依赖风险等问题。
---

# 安全审计技能

为"黑马记账"项目检查代码安全风险，给出修复建议。

## 检查项

### 一、敏感信息泄露

检查代码中是否有不应出现的敏感信息：

| 检查模式 | 说明 |
|----------|------|
| API Key / Token | `apiKey`、`secret`、`token`、`password` 等变量是否硬编码了真实值 |
| 私钥 / 证书 | 代码中是否嵌入了 `.pem`、`.key`、证书内容 |
| 内网地址 | 是否有内网 IP、内部域名泄露到代码中 |
| 个人信息 | 是否有邮箱、手机号、身份证号等硬编码 |

查找方式：搜索以下关键词
```
password, passwd, secret, token, api_key, apikey, private_key, 
access_key, auth_token, bearer, credential
```

### 二、SQL 注入风险

本项目使用 `sql.js`（SQLite），数据库操作通过 IPC 调用主进程执行。

**安全的写法**（参数化查询）：
```typescript
db.query('SELECT * FROM expenses WHERE type = ?', [userInput])
db.run('INSERT INTO expenses (amount) VALUES (?)', [amount])
```

**危险的写法**（字符串拼接）：
```typescript
db.query(`SELECT * FROM expenses WHERE type = '${userInput}'`)   // ❌ 注入风险
db.run('DELETE FROM expenses WHERE id = ' + id)                   // ❌ 注入风险
```

检查要点：
- ❌ 模板字符串拼接 SQL：`` `SELECT * FROM ${table}` ``
- ❌ 字符串 `+` 拼接 SQL：`'WHERE id = ' + id`
- ❌ 用户输入直接拼进 SQL 而没有用 `?` 占位符
- ❌ 动态表名/列名/ORDER BY 未做白名单校验

### 三、配置文件安全

检查所有配置文件是否有敏感信息明文存储：

| 文件 | 检查点 |
|------|--------|
| `package.json` | 是否有硬编码的密钥、token |
| `electron-builder.yml` | 是否有签名证书密码、API key |
| `.claude/settings.json` | 是否有 token 泄露 |
| `.env*` 文件 | 如果有，是否被 `.gitignore` 排除 |
| `tailwind.config.js` / `tsconfig*.json` 等 | 通常安全，顺便看一眼 |

### 四、Electron 安全

本项目是 Electron 桌面应用，需要检查：

**（1）主进程安全（`src/main/index.ts`）**

- `contextIsolation` 是否为 `true`？（必须为 true，否则渲染进程能直接访问 Node.js）
- `nodeIntegration` 是否为 `false`？（必须为 false，否则网页可以执行系统命令）
- `webSecurity` 是否被禁用？
- 是否加载了远程 URL？（应只加载本地文件）

**（2）预加载脚本安全（`src/preload/index.ts`）**

- `contextBridge.exposeInMainWorld` 暴露的 API 是否过多？
- 是否暴露了 `shell.openExternal`？（可能被用于打开恶意链接）
- 是否暴露了文件系统写权限？（需确认使用场景合理）

**（3）IPC 通信安全**

- `ipcMain.handle` 是否对调用参数做了校验？
- 是否存在"万能通道"（一个 IPC 通道可以执行任意 SQL/命令）

### 五、依赖风险

- `npm audit` 是否有已知漏洞？
- 是否有长时间未更新的依赖？

## 工作流程

### 第一步：确定检查范围

1. **用户指定了文件/目录** → 只检查指定范围
2. **用户说"全部检查"或没指定** → 检查以下内容：
   - `src/main/index.ts`（主进程，权限最大）
   - `src/preload/index.ts`（预加载，安全边界）
   - `src/renderer/db/*.ts`（数据库操作，SQL 注入入口）
   - 所有配置文件（`package.json`、`electron-builder.yml`、`.claude/settings.json`）
   - `npm audit` 依赖检查

### 第二步：逐项检查

按五个检查项逐一排查，记录所有发现的问题。

### 第三步：生成报告

```
## 🔒 安全审计报告

### 总体评估

| 指标 | 数值 |
|------|------|
| 检查文件数 | X 个 |
| 🔴 严重 | X 个 |
| 🟡 警告 | X 个 |
| 🔵 建议 | X 个 |
| ✅ 安全等级 | A / B / C / D |

### 问题清单

#### 🔴 严重 — 必须立即修复

| 文件 | 行号 | 问题 | 修复建议 |
|------|------|------|----------|
| xxx.ts | L15 | SQL 字符串拼接 | 改用 `?` 参数化查询 |

#### 🟡 警告 — 建议近期修复

| 文件 | 行号 | 问题 | 修复建议 |
|------|------|------|----------|
| xxx.ts | L8 | contextIsolation 为 false | 设为 true |

#### 🔵 建议 — 可选改进

| 文件 | 行号 | 问题 | 修复建议 |
|------|------|------|----------|

### 各检查项详情

#### 一、敏感信息泄露 — ✅ 未发现
#### 二、SQL 注入 — 🟡 发现 1 处警告
#### 三、配置文件安全 — ✅ 未发现
#### 四、Electron 安全 — ✅ 未发现
#### 五、依赖风险 — 🔵 2 个低危漏洞
```

## 安全等级

| 等级 | 条件 |
|------|------|
| ✅ A | 无任何问题 |
| ⚠️ B | 仅有 🔵 建议 |
| 🟡 C | 有 🟡 警告，无 🔴 严重 |
| 🔴 D | 有 🔴 严重问题 |

## 注意事项

1. **本项目是完全本地应用**，不上传数据到服务器，所以数据传输安全不是关注重点
2. **sql.js 是 WASM 实现的 SQLite**，没有网络连接，SQL 注入的危害仅限于本地数据库，不会影响服务器
3. 即使风险较低，SQL 注入仍然需要修复（用户可以输入恶意内容破坏自己的数据库）
4. **不要自动修改代码**：安全审计只做检查，修复方案需用户确认后再执行
