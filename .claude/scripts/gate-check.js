/**
 * gate-check.js — Git Commit 质量门禁检查脚本
 *
 * 被 PreToolUse Hook 调用，每次 git commit 前自动执行。
 * 检查 .claude/qa-results/ 下的通行证文件是否有效。
 *
 * 退出码：
 *   0 — 放行，允许提交
 *   1 — 拦截，拒绝提交
 */

const fs = require('fs')
const path = require('path')

// === 通行证文件路径 ===
const QA_DIR = path.resolve(__dirname, '..', 'qa-results')
const TEST_RESULT = path.join(QA_DIR, 'test-result.json')
const QUALITY_RESULT = path.join(QA_DIR, 'quality-result.json')

// === 通行证有效期（毫秒）===
const VALIDITY_MS = 60 * 60 * 1000 // 1 小时

// === 辅助函数 ===
function now() {
  return new Date().toISOString()
}

function fail(reason) {
  console.error('')
  console.error('⛔ 质量门禁拦截')
  console.error(`   原因：${reason}`)
  console.error('')
  console.error('   请先运行质量检查：')
  console.error('     /git-save — 自动运行检查并提交')
  console.error('     或直接说"存档"触发 gitcommit-agent')
  console.error('')
  process.exit(1)
}

// === 主检查逻辑 ===

// 1. 检查文件是否存在
for (const [name, filePath] of [['test-result.json', TEST_RESULT], ['quality-result.json', QUALITY_RESULT]]) {
  if (!fs.existsSync(filePath)) {
    fail(`缺少通行证文件 "${name}"，尚未运行质量检查`)
  }
}

// 2. 读取并解析
let testResult, qualityResult
try {
  testResult = JSON.parse(fs.readFileSync(TEST_RESULT, 'utf-8'))
} catch (e) {
  fail(`test-result.json 文件损坏，无法解析：${e.message}`)
}
try {
  qualityResult = JSON.parse(fs.readFileSync(QUALITY_RESULT, 'utf-8'))
} catch (e) {
  fail(`quality-result.json 文件损坏，无法解析：${e.message}`)
}

// 3. 检查是否通过
if (!testResult.passed) {
  const stats = testResult.stats || {}
  fail(`单元测试未通过！${stats.total || '?'} 个测试，${stats.failed || '?'} 个失败`)
}

if (!qualityResult.passed) {
  const parts = []
  if (qualityResult.security === 'C' || qualityResult.security === 'D') parts.push(`安全审计评级为 ${qualityResult.security}`)
  if (qualityResult.comments === '❌') parts.push('注释覆盖率严重不足')
  if (qualityResult.codeStyle === '❌') parts.push('代码规范不达标')
  fail(parts.length > 0 ? parts.join('；') : '质量检查未通过')
}

// 4. 检查时间戳（防过期）
const nowMs = Date.now()
for (const [name, result] of [['test-result.json', testResult], ['quality-result.json', qualityResult]]) {
  if (!result.timestamp) {
    fail(`"${name}" 缺少时间戳，通行证无效`)
  }
  const age = nowMs - new Date(result.timestamp).getTime()
  if (age > VALIDITY_MS) {
    const minutesAgo = Math.round(age / 60000)
    fail(`通行证已过期（${minutesAgo} 分钟前签发，有效期 60 分钟）。请重新运行质量检查`)
  }
}

// 5. 全部通过
const testAge = Math.round((nowMs - new Date(testResult.timestamp).getTime()) / 60000)
const qualityAge = Math.round((nowMs - new Date(qualityResult.timestamp).getTime()) / 60000)
console.log(`✅ 质量门禁已通过（test ${testAge}min 前, quality ${qualityAge}min 前）`)
process.exit(0)
