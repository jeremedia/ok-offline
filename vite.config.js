import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  server: {
    port: 8000,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'https://api.burningman.org',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the API key header
            const apiKey = req.headers['x-api-key'];
            if (apiKey) {
              proxyReq.setHeader('X-API-Key', apiKey);
            }
          });
        }
      }
    }
  }
})