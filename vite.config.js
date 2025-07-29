import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [
    vue(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace('{{APP_VERSION}}', version)
      }
    },
    {
      name: 'copy-leaflet-images',
      writeBundle() {
        // Copy Leaflet images to dist
        const leafletImagesPath = resolve(__dirname, 'node_modules/leaflet/dist/images')
        const distImagesPath = resolve(__dirname, 'dist/images')
        
        try {
          mkdirSync(distImagesPath, { recursive: true })
          
          // Copy marker icons
          const files = [
            'marker-icon.png',
            'marker-icon-2x.png',
            'marker-shadow.png',
            'layers.png',
            'layers-2x.png'
          ]
          
          files.forEach(file => {
            copyFileSync(
              resolve(leafletImagesPath, file),
              resolve(distImagesPath, file)
            )
          })
          
          console.log('Leaflet images copied to dist/images')
        } catch (err) {
          console.error('Error copying Leaflet images:', err)
        }
      }
    }
  ],
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