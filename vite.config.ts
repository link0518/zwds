import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {},
    server: {
      // 开发模式下将 API 请求代理到本地 Express 服务器
      proxy: {
        '/api': {
          target: 'http://localhost:3088',
          changeOrigin: true,
        },
      },
    },
  }
})
