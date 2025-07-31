<template>
  <div class="icon-viewer">
    <div class="header-section">
      <h1>OK-OFFLINE Icons & Images</h1>
      <p class="subtitle">All app icons and social media images</p>
    </div>

    <div class="icons-grid">
      <!-- App Icons -->
      <div class="icon-section">
        <h2>App Icons</h2>
        <div class="icon-group">
          <div v-for="icon in appIcons" :key="icon.path" class="icon-item">
            <div class="icon-preview" :class="icon.class">
              <img :src="icon.path" :alt="icon.name" />
            </div>
            <h3>{{ icon.name }}</h3>
            <p class="icon-size">{{ icon.size }}</p>
            <p class="icon-usage">{{ icon.usage }}</p>
          </div>
        </div>
      </div>

      <!-- Social Media Images -->
      <div class="icon-section">
        <h2>Social Media Images</h2>
        <div class="social-group">
          <div v-for="image in socialImages" :key="image.path" class="social-item">
            <div class="social-preview">
              <img :src="image.path" :alt="image.name" />
            </div>
            <div class="social-info">
              <h3>{{ image.name }}</h3>
              <p class="icon-size">{{ image.size }}</p>
              <p class="icon-usage">{{ image.usage }}</p>
              <code v-if="image.meta" class="meta-tag">{{ image.meta }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Other Assets -->
      <div class="icon-section">
        <h2>Other Assets</h2>
        <div class="icon-group">
          <div v-for="asset in otherAssets" :key="asset.path" class="icon-item">
            <div class="icon-preview" :class="asset.class">
              <img :src="asset.path" :alt="asset.name" />
            </div>
            <h3>{{ asset.name }}</h3>
            <p class="icon-usage">{{ asset.usage }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const appIcons = ref([
  {
    name: 'icon-16.png',
    path: '/images/icon-16.png',
    size: '16×16',
    usage: 'Browser favicon (smallest)',
    class: 'tiny'
  },
  {
    name: 'icon-32.png',
    path: '/images/icon-32.png',
    size: '32×32',
    usage: 'Browser favicon (standard)',
    class: 'small'
  },
  {
    name: 'icon-192.png',
    path: '/images/icon-192.png',
    size: '192×192',
    usage: 'PWA icon (Android)',
    class: 'medium'
  },
  {
    name: 'icon-512.png',
    path: '/images/icon-512.png',
    size: '512×512',
    usage: 'PWA icon (splash screens)',
    class: 'large'
  },
  {
    name: 'icon-1024.png',
    path: '/images/icon-1024.png',
    size: '1024×1024',
    usage: 'Source icon (highest res)',
    class: 'xlarge'
  },
  {
    name: 'apple-touch-icon.png',
    path: '/images/apple-touch-icon.png',
    size: '180×180',
    usage: 'iOS home screen',
    class: 'medium'
  }
])

const socialImages = ref([
  {
    name: 'og-image.png',
    path: '/images/og-image.png',
    size: '1536×1024',
    usage: 'Source social image',
    meta: null
  },
  {
    name: 'og-image-1200x630.png',
    path: '/images/og-image-1200x630.png',
    size: '1200×630',
    usage: 'Open Graph (Facebook, LinkedIn)',
    meta: '<meta property="og:image" content="/images/og-image-1200x630.png">'
  },
  {
    name: 'twitter-card-1200x600.png',
    path: '/images/twitter-card-1200x600.png',
    size: '1200×600',
    usage: 'Twitter Card',
    meta: '<meta name="twitter:image" content="/images/twitter-card-1200x600.png">'
  },
  {
    name: 'social-square-1200x1200.png',
    path: '/images/social-square-1200x1200.png',
    size: '1200×1200',
    usage: 'Instagram, WhatsApp',
    meta: null
  }
])

const otherAssets = ref([
  {
    name: 'og-default.png',
    path: '/images/og-default.png',
    usage: 'Previous OG image (reference)',
    class: 'wide'
  },
  {
    name: 'marker-icon.png',
    path: '/images/marker-icon.png',
    usage: 'Leaflet map marker',
    class: 'tiny'
  },
  {
    name: 'marker-shadow.png',
    path: '/images/marker-shadow.png',
    usage: 'Leaflet marker shadow',
    class: 'small'
  }
])
</script>

<style scoped>
.icon-viewer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.header-section h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  font-family: 'Berkeley Mono', monospace;
}

.subtitle {
  color: var(--color-text-disabled);
  font-size: 1.2em;
}

.icons-grid {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.icon-section {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 30px;
}

.icon-section h2 {
  font-size: 1.8em;
  margin-bottom: 30px;
  color: var(--color-text-primary);
  font-family: 'Berkeley Mono', monospace;
}

.icon-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
}

.icon-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px var(--color-shadow-light);
  transition: transform 0.2s;
}

.icon-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px var(--color-shadow-medium);
}

.icon-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  min-height: 100px;
}

.icon-preview img {
  display: block;
  image-rendering: crisp-edges;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.icon-preview.tiny img {
  width: 32px;
  height: 32px;
}

.icon-preview.small img {
  width: 48px;
  height: 48px;
}

.icon-preview.medium img {
  width: 96px;
  height: 96px;
}

.icon-preview.large img {
  width: 128px;
  height: 128px;
}

.icon-preview.xlarge img {
  width: 160px;
  height: 160px;
}

.icon-preview.wide img {
  width: 100%;
  max-width: 300px;
  height: auto;
}

.icon-item h3 {
  font-size: 1.1em;
  margin-bottom: 5px;
  font-family: 'Berkeley Mono', monospace;
  color: var(--color-text-primary);
}

.icon-size {
  color: var(--color-text-disabled);
  font-size: 0.9em;
  margin-bottom: 5px;
  font-family: 'Berkeley Mono', monospace;
}

.icon-usage {
  color: var(--color-text-muted);
  font-size: 0.85em;
  line-height: 1.4;
}

/* Social Media Section */
.social-group {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.social-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px var(--color-shadow-light);
  display: flex;
  gap: 30px;
  align-items: center;
}

.social-preview {
  flex-shrink: 0;
}

.social-preview img {
  width: 300px;
  height: auto;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  display: block;
}

.social-info {
  flex: 1;
}

.social-info h3 {
  font-size: 1.3em;
  margin-bottom: 10px;
  font-family: 'Berkeley Mono', monospace;
  color: var(--color-text-primary);
}

.meta-tag {
  display: block;
  margin-top: 15px;
  padding: 10px;
  background: var(--color-bg-input);
  border-radius: 4px;
  font-size: 0.85em;
  font-family: 'Berkeley Mono', monospace;
  word-break: break-all;
  color: var(--color-text-secondary);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .icon-viewer {
    padding: 15px;
  }

  .header-section h1 {
    font-size: 2em;
  }

  .icon-section {
    padding: 20px;
  }

  .icon-group {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
  }

  .social-item {
    flex-direction: column;
    text-align: center;
  }

  .social-preview img {
    width: 100%;
    max-width: 300px;
  }

  .icon-preview.xlarge img {
    width: 120px;
    height: 120px;
  }
}

/* Dark mode support - Already handled by theme system */
</style>