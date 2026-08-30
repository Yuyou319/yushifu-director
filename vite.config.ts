import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本地优先应用：浏览器直接调用用户配置的 API（BYOK）。
// 后续可用 Tauri 套壳打包成桌面端，此处无需后端。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
    proxy: {
      // 开发模式下把跨域 API 请求转发到目标服务器，绕过浏览器 CORS。
      // 用法：/apiproxy/<encodeURIComponent(完整 URL)> → 转发到该 URL。
      '/apiproxy': {
        target: 'http://localhost',
        changeOrigin: true,
        router: (req) => {
          const encoded = (req.url || '').replace(/^\/apiproxy\//, '').split('?')[0];
          try {
            return new URL(decodeURIComponent(encoded)).origin;
          } catch {
            return 'http://localhost';
          }
        },
        rewrite: (p) => {
          const encoded = p.replace(/^\/apiproxy\//, '').split('?')[0];
          try {
            const u = new URL(decodeURIComponent(encoded));
            return u.pathname + u.search;
          } catch {
            return p;
          }
        }
      }
    }
  }
})
