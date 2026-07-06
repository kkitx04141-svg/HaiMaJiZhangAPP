/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // 主色调：沉稳蓝（记账 App 适合冷静、专业的色调）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // 支出红
        expense: '#ef4444',
        // 收入绿（预留，当前版本只做支出）
        income: '#22c55e',
      },
    },
  },
  plugins: [],
}
