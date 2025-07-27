<template>
  <div class="tab-content about-content">
    <h2>About OK-OFFLINE!</h2>
    
    <div class="about-section">
      <p>
        OK-OFFLINE is an offline-first Progressive Web App for Burning Man that lets you browse camps, 
        art installations, and events without connectivity.
      </p>
      
      <p>
        Brought to you by <strong><a href="/2025/camps/a1XVI000009ssUT2AY" class="camp-link">Mr. OK of OKNOTOK</a></strong>.
      </p>
      
      <p class="version-info">
        Version: <strong>{{ appVersion }}</strong><br>
        <span class="build-time">Built: {{ buildTime }}</span>
      </p>
      
      <button @click="showReleaseNotes = true" class="release-notes-button">
        📋 View Release Notes
      </button>
    </div>

    <div class="about-section">
      <h3>How It Works</h3>
      <ol>
        <li>Sync data while you have internet (WiFi recommended)</li>
        <li>All data is stored locally on your device</li>
        <li>Browse camps, art, and events completely offline</li>
        <li>Your favorites, schedule, and notes stay private</li>
      </ol>
    </div>

    <div class="about-section">
      <h3>Privacy First</h3>
      <p>
        OK-OFFLINE respects your privacy:
      </p>
      <ul>
        <li>No account or login required</li>
        <li>No personal data uploaded</li>
        <li>No tracking or analytics</li>
        <li>Emergency info stays local only</li>
      </ul>
    </div>

    <div class="about-section">
      <h3>Open Source</h3>
      <p>
        OK-OFFLINE is open source and available on GitHub:<br>
        <a href="https://github.com/jeremedia/ok-offline" target="_blank" rel="noopener">
          github.com/jeremedia/ok-offline
        </a>
      </p>
    </div>

    <div class="about-section">
      <h3>Acknowledgments</h3>
      <ul>
        <li>Data provided by the <a href="https://api.burningman.org" target="_blank" rel="noopener">Burning Man Public API</a></li>
        <li>Map data from Burning Man Innovate GIS</li>
        <li>Built with Vue 3, Vite, and Leaflet</li>
      </ul>
    </div>

    <!-- Release Notes Modal -->
    <div v-if="showReleaseNotes" class="modal-overlay" @click="showReleaseNotes = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Release Notes</h2>
          <button @click="showReleaseNotes = false" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div v-for="release in releaseNotes" :key="release.version" class="release-section">
            <h3>Version {{ release.version }} - {{ release.date }}</h3>
            
            <div v-if="release.added?.length" class="release-group">
              <h4>✨ Added</h4>
              <ul>
                <li v-for="(item, idx) in release.added" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div v-if="release.changed?.length" class="release-group">
              <h4>🔄 Changed</h4>
              <ul>
                <li v-for="(item, idx) in release.changed" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div v-if="release.fixed?.length" class="release-group">
              <h4>🐛 Fixed</h4>
              <ul>
                <li v-for="(item, idx) in release.fixed" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div v-if="release.security?.length" class="release-group">
              <h4>🔒 Security</h4>
              <ul>
                <li v-for="(item, idx) in release.security" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div v-if="release.breaking?.length" class="release-group">
              <h4>💥 Breaking Changes</h4>
              <ul>
                <li v-for="(item, idx) in release.breaking" :key="idx">{{ item }}</li>
              </ul>
            </div>
            
            <div v-if="release.technical?.length" class="release-group">
              <h4>🔧 Technical</h4>
              <ul>
                <li v-for="(item, idx) in release.technical" :key="idx">{{ item }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Version info
const appVersion = __APP_VERSION__
const buildTime = new Date(__BUILD_TIME__).toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric', 
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
})

// Modal state
const showReleaseNotes = ref(false)

// Release notes data
const releaseNotes = [
  {
    version: '3.6.0',
    date: '2025-07-27',
    added: [
      '🎨 Unified List Controls - Professional gestalt-coherent control system',
      '🔍 Integrated search, sort, and filter controls with real-time result counting',
      '📱 Mobile-optimized detail pages with consistent 8px spacing rhythm',
      '⭐ Enlarged favorite star (3rem) for better touch interaction',
      '🎯 Command+click to toggle all groups (like Finder)',
      '📊 Dynamic result counts in list headers and filter summary',
      '🔄 Smart clear button that appears only when filters are active'
    ],
    changed: [
      '🏗️ Complete redesign of list control interface for camps, art, and events',
      '📐 Detail view layout with improved visual hierarchy and gestalt principles',
      '🎨 Safari-specific fixes for settings tab rendering',
      '📱 Groups now collapsed by default for better mobile performance',
      '🔧 Global box-sizing: border-box for consistent layout calculations',
      '💫 Favorite star moved to right side of detail headers',
      '📏 Consistent spacing using 8px rhythm throughout detail views'
    ],
    fixed: [
      '🦁 Safari zero-height tab buttons with negative margin removal',
      '📱 Horizontal scrolling issues in settings and content areas',
      '🎯 Tab bar centering and cropping on mobile devices',
      '📐 Detail page overflow and layout issues',
      '🔍 Search and filter controls alignment and spacing',
      '📱 Mobile footer redundancy removed'
    ],
    technical: [
      '🧩 New ListControls.vue component for unified control interface',
      '🎨 CSS architecture improvements with consistent spacing system',
      '📦 Reduced component coupling through props/emits pattern',
      '🔧 Safari flexbox compatibility improvements'
    ]
  },
  {
    version: '3.2.0',
    date: '2025-07-27',
    added: [
      '📱 Complete Mobile Optimization - Comprehensive mobile-first design overhaul',
      '👆 Touch-friendly bottom navigation with haptic feedback',
      '👈 Swipe gestures for horizontal navigation between main views',
      '↓ Pull-to-refresh functionality on mobile devices',
      '📲 Mobile-responsive header with streamlined actions',
      '🎯 Touch targets sized for optimal mobile interaction (44px minimum)',
      '✨ Advanced Mobile UX with professional interaction patterns',
      '📑 Settings Interface Revolution - Modular tabbed architecture',
      '🏗️ Seven specialized tabs: About, Data Sync, Features, Maps, Implementation, Feedback, Emergency',
      '🔧 Each tab implemented as independent Vue component for maintainability'
    ],
    changed: [
      '🚀 Mobile-First Navigation - Complete navigation paradigm shift',
      '📱 Desktop retains traditional header navigation, mobile uses bottom navigation',
      '🔍 Search and settings become prominent mobile header actions',
      '👆 Touch Interaction Design optimized for finger navigation',
      '📐 Increased touch target sizes throughout interface',
      '🎨 Enhanced visual feedback for touch interactions',
      '🏛️ Settings Architecture - From monolithic to modular design'
    ],
    technical: [
      '📱 Mobile Detection Logic with smart responsive behavior',
      '🏗️ Component Architecture improvements with shared CSS design system',
      '📦 Modular imports reduce bundle size impact',
      '🎯 Clear separation of concerns between mobile/desktop interfaces',
      '🔨 Added HammerJS for professional touch gesture library'
    ]
  },
  {
    version: '2.0.0',
    date: '2025-07-26',
    added: [
      'Secure Rails API proxy for weather data integration',
      'Vite development proxy for local Rails backend connection',
      'Real-time weather and dust forecast for Black Rock City',
      'Apple WeatherKit integration via secure JWT authentication proxy',
      'Moon phase data for navigation at Burning Man',
      'OpenWeatherMap primary weather service with Rails fallback strategy',
      'Emergency features moved to Settings tab (cleaner navigation)',
      'Rails API service (ok-offline-api) for server-side weather integration',
      'CORS-compliant weather data fetching through proxy',
      'Auto-refresh weather data every 15 minutes',
      'Detailed weather metrics (temperature, wind, humidity, pressure, visibility)',
      '5-day dust forecast with protection recommendations',
      'Dust level scale and safety tips',
      'Sun times (sunrise/sunset) for Black Rock City',
      'Weather data caching for offline use',
      'Apple WeatherKit data source attribution',
      'Robust error handling for weather services',
      'Professional GIS data integration with map rotation capabilities'
    ],
    changed: [
      'SECURITY: All API credentials now handled server-side only',
      'Weather services completely refactored to use Rails API endpoints',
      'Emergency button moved from navigation header to Settings tab',
      'Dev server port updated to 8005 for proxy configuration',
      'Enhanced dust forecast view with real weather data',
      'Improved weather service architecture with secure proxy fallbacks',
      'Development workflow now requires running Rails backend service'
    ],
    fixed: [
      'SECURITY: No more exposed API keys in frontend JavaScript',
      'Console errors from weather API calls',
      'CORS issues with Apple WeatherKit by implementing Rails backend proxy',
      'Doubled padding in weather UI components',
      'Template null reference errors in weather display',
      'Airport location coordinates updated to accurate GIS data'
    ],
    security: [
      'Removed Apple WeatherKit private key from frontend repository',
      'Implemented secure server-side proxy for all weather API calls',
      'Eliminated client-side API credential exposure',
      'Added proper CORS configuration for production deployment'
    ],
    breaking: [
      'SECURITY: Removed all hardcoded API credentials from frontend code',
      'Weather API integration now requires Rails backend service',
      'Apple WeatherKit authentication moved to secure server-side proxy'
    ]
  },
  {
    version: '1.2.5',
    date: '2025-01-26',
    added: [
      'Pre-enriched event data in static files for better performance',
      'Environment variable support for API keys (.env file)',
      'Scripts for data enrichment and processing',
      'PWA icons in multiple sizes for better device support',
      'Support for other_location field in events'
    ],
    changed: [
      'Events are now pre-enriched with location data at build time',
      'API key moved to environment variables for security',
      'Removed runtime enrichment to save processing on mobile devices',
      'Service worker cache version bumped to v3'
    ],
    fixed: [
      'Events with custom locations now display correctly',
      'Unknown location issues for enriched events'
    ]
  },
  {
    version: '1.2.4',
    date: '2025-01-26',
    added: [
      'Static data files for offline-first architecture',
      'Toast notification system for user feedback',
      'New /public/data directory structure for pre-cached data',
      'Service worker improvements for better offline performance'
    ],
    changed: [
      'Data sync now uses static files instead of live API',
      'Improved error handling and user feedback',
      'Better offline detection and status indicators'
    ],
    fixed: [
      'Race conditions during initial data sync',
      'Memory issues with large datasets',
      'Service worker update notifications'
    ]
  }
]
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Component-specific styles */
.build-time {
  font-size: 0.8rem;
  color: #666;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 8px;
  max-width: 800px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #444;
}

.modal-header h2 {
  margin: 0;
  color: #fff;
}

.close-button {
  background: none;
  border: none;
  color: #999;
  font-size: 2rem;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-button:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.release-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #333;
}

.release-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.release-section h3 {
  color: #fff;
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
}

.release-group {
  margin-bottom: 1.5rem;
}

.release-group h4 {
  color: #ccc;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.release-group ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #999;
  line-height: 1.8;
}

.release-group li {
  margin-bottom: 0.25rem;
}

/* Camp link styling */
.camp-link {
  color: #8B0000;
  text-decoration: none;
  transition: color 0.2s ease;
}

.camp-link:hover {
  color: #FF4444;
  text-decoration: underline;
}
</style>