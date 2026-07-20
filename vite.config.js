import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { version } from './package.json'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const buildRevision = process.env.GITHUB_SHA || process.env.VITE_BUILD_REVISION || 'local'

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
    },
    {
      name: 'release-metadata',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'release.json',
          source: `${JSON.stringify({ version, commit: buildRevision, builtAt: new Date().toISOString() }, null, 2)}\n`
        })
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_REVISION__: JSON.stringify(buildRevision)
  },
  server: {
    port: 8005,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      'dev.offline.oknotok.com',
      '.oknotok.com' // This allows any subdomain of oknotok.com
    ],
    hmr: {
      protocol: 'wss',
      host: 'dev.offline.oknotok.com',
      clientPort: 443
    },
    proxy: {
      '/api/v1': {
        target: 'http://127.0.0.1:3555',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
