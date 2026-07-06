// 删除 ELECTRON_RUN_AS_NODE 环境变量，然后启动 electron-vite dev
// 这个变量会导致 Electron 以纯 Node.js 模式运行，丢失所有 Electron API

const { spawn } = require('child_process')

// 构建一个干净的环境变量对象，排除 ELECTRON_RUN_AS_NODE
const cleanEnv = {}
for (const key of Object.keys(process.env)) {
  if (key !== 'ELECTRON_RUN_AS_NODE') {
    cleanEnv[key] = process.env[key]
  }
}

// 使用 npx 启动 electron-vite
const child = spawn('npx', ['electron-vite', 'dev'], {
  stdio: 'inherit',
  env: cleanEnv,
  shell: true
})

child.on('error', (err) => {
  console.error('启动失败:', err.message)
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code || 0)
})
