import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src/renderer')
    }
  },
  test: {
    // 测试文件目录
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // 排除 node_modules
    exclude: ['node_modules', 'out', 'dist']
  }
})
