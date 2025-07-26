import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8000,
    proxy: {
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