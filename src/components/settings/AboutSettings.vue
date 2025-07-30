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
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
  showReleaseNotes: {
    type: Boolean,
    default: false
  }
})

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

// Auto-show release notes if prop is true
onMounted(() => {
  if (props.showReleaseNotes) {
    showReleaseNotes.value = true
  }
})

// Release notes data
const releaseNotes = [
  {
    version: '3.15.0',
    date: '2025-07-30',
    added: [
      '✏️ Custom Entries - Create and manage your own camps, art, and events',
      '➕ Floating action button on list views for quick access to add custom entries',
      '📍 Dual-mode location picker supporting both intersection selection and GPS coordinates',
      '🎨 Dedicated forms for each type with appropriate fields and validation',
      '💾 Custom entries persist through API data syncs and refreshes',
      '👁️ Visual indicators (pencil icon) distinguish custom entries from official data',
      '📂 Auto-open for filtered groups with 5 or fewer items',
      '📱 Full mobile optimization with responsive forms and touch-friendly controls'
    ],
    fixed: [
      '🎨 Dark theme styling applied to all form inputs including slotted content',
      '💾 Fixed DataCloneError when saving Vue reactive objects to IndexedDB',
      '🎯 Properly centered pencil icon with "CUSTOM ENTRY" badge text'
    ],
    changed: [
      '📋 List view automatically opens small filtered groups for better discoverability',
      '🔧 Storage service modified to preserve custom entries during data syncs'
    ],
    technical: [
      '🏗️ Reusable form component architecture with slot-based customization',
      '🎨 CSS :deep() selectors for styling slotted form content',
      '🆔 Custom entry IDs follow pattern: custom-{type}-{timestamp}-{random}',
      '📦 New services: customEntries.js, FloatingActionButton.vue, FormModal.vue, LocationPicker.vue'
    ]
  },
  {
    version: '3.13.4',
    date: '2025-07-29',
    added: [
      '🔍 Searchable Notes - Personal notes are now searchable across camps, art, and events',
      '👥 Find friends easily by searching for names mentioned in your notes',
      '📝 Enhanced search functionality includes all your personal annotations'
    ],
    fixed: [
      '🔎 Search now includes notes field when looking for camps, art, or events'
    ],
    technical: [
      '🔧 Modified keyword search to include notes from visits service',
      '📦 Import getItemNotes function for comprehensive search coverage'
    ]
  },
  {
    version: '3.12.0',
    date: '2025-07-29',
    added: [
      '🗺️ Ultimate Map Enhancement - Complete overhaul of map interface with tabbed controls',
      '📑 Organized controls into Content/Layers/Display tabs for better UX',
      '🔍 Map Info Inspector showing live coordinates and BRC address under cursor',
      '📊 Draggable interactive legend with minimize functionality',
      '🏗️ Comprehensive infrastructure layer with DMZ, Hell Station, and all services',
      '🚻 Porto (toilet) locations - 45 banks displayed as blue polygons with icons',
      '🅿️ Plaza Portals layer showing 5 entrance points to themed plazas',
      '#️⃣ Pentagon fence perimeter points with number emojis',
      '🛤️ Street outlines layer with red semi-transparent fill',
      '🔄 Official GIS data integration via git submodule for automatic updates',
      '🔐 Location data compliance with countdown timer and smart controls',
      '⏰ Automatic enforcement of Burning Man API visibility policy'
    ],
    fixed: [
      '🗺️ Base map tiles now enabled by default for 2025',
      '🔧 Infrastructure markers properly clear when toggled off',
      '🚻 Porto polygons no longer disappear when street outlines enabled',
      '👆 Porto icons now properly clickable for popup information',
      '🏛️ Temple location using accurate GIS coordinates',
      '📍 Reference points (CPNs) clear correctly when disabled',
      '🔄 Map rotation reset buttons properly update the map view'
    ],
    changed: [
      '📋 Map controls reorganized - Infrastructure in Content tab, Plazas/CPNs in Layers',
      '🗺️ Base map logic - only available for 2025 (disabled for other years)'
    ],
    technical: [
      '⚙️ Added Vite @ alias configuration for cleaner imports',
      '🏗️ Modular map control components with persistent state',
      '💾 Enhanced localStorage integration for user preferences',
      '🎨 Consistent dark theme styling throughout map controls'
    ]
  },
  {
    version: '3.11.0',
    date: '2025-07-28',
    added: [
      '🗺️ API-Hosted Tile Distribution - Self-hosted map tiles to eliminate OpenStreetMap throttling',
      '📦 Single ZIP download (2.24MB) instead of 641 individual tile requests',
      '⚡ Complete tile coverage for Black Rock City area (zoom levels 12-17)',
      '🔧 Enhanced Reset Options - Added map tile management to development reset page',
      '🗃️ "Clear Map Tiles" option for testing tile re-download functionality'
    ],
    fixed: [
      '🗺️ Map Tile Offline Loading - Resolved critical issue where tiles weren\'t loading when offline',
      '📱 Eliminated all network requests when offline - tiles now served from local IndexedDB storage',
      '🔗 Fixed leaflet.offline integration with proper subdomain handling (a/b/c.tile.openstreetmap.org)',
      '📐 Corrected coordinate calculation bug that caused incomplete tile coverage',
      '✅ Added complete tile coverage verification for all zoom levels'
    ],
    technical: [
      '🏗️ Rails rake task downloads and packages all BRC tiles into optimized ZIP file',
      '🌐 API endpoint `/api/v1/tiles/package.zip` serves tile packages to frontend',
      '💾 Tiles stored with all subdomain variations to match leaflet.offline expectations',
      '🔄 Automatic fallback to individual tile downloads if ZIP method fails',
      '🧪 Enhanced PWA Test Reset includes map tile database cleanup'
    ]
  },
  {
    version: '3.10.0',
    date: '2025-07-28',
    added: [
      '🌍 Global Location Data State Management - Smart handling of Burning Man\'s location data policy',
      '📍 Per-year location data availability tracking with automatic detection during sync',
      '🔒 Policy enforcement for 2025 data (hidden until 3 weeks before event)',
      '✨ Enhanced Progressive Sync UI with live count updates per year',
      '📊 Consolidated sync steps from 7 to 6 for clearer progress visualization',
      '📅 Conditional "locations TBA 3 weeks before event" messages throughout UI',
      '🎯 Location policy compliance respecting Burning Man API data release schedule'
    ],
    changed: [
      '🔄 Fixed year loading order to prioritize 2025 → 2024 → 2023',
      '🏗️ Sync architecture now integrates with global state during data processing',
      '📝 Better stage management with clear start/complete events for each year'
    ],
    fixed: [
      '🎨 ProgressiveLoader visual hierarchy with proper step number sizing',
      '🎯 Step numbers now fill full height with borders touching top/bottom',
      '🎨 Corrected count label colors from gold to secondary text (#ccc)',
      '⚡ Improved transition timing from 0.3s to 0.2s for snappier feel',
      '🔇 Silenced all tile download console logs for cleaner development'
    ],
    technical: [
      '🏗️ Created globalState.js with Vue 3 reactive state management',
      '📚 Added comprehensive documentation for state management patterns',
      '🔧 Enhanced architecture documentation with state layer details',
      '💾 Persistent state storage across sessions with localStorage'
    ]
  },
  {
    version: '3.8.1',
    date: '2025-07-27',
    fixed: [
      '🔧 Corrected production API URL for vector search service integration',
      '🌐 Improved vector search connectivity and error handling'
    ],
    technical: [
      '🔗 Vector search service now properly configured for production deployment',
      '📡 Enhanced API endpoint configuration for semantic search features'
    ]
  },
  {
    version: '3.8.0',
    date: '2025-07-27',
    added: [
      '🧠 Vector Search Integration - AI-powered semantic search capabilities',
      '🔍 Three intelligent search modes: Keyword (offline), Semantic (online), and Smart hybrid',
      '🎯 SearchModeSelector component for intuitive search type switching',
      '📊 Enhanced SearchResultItem with similarity scores and improved visual layout',
      '💡 SearchSuggestions component with entity-based autocomplete functionality',
      '🚀 Vector search service with intelligent caching and offline fallback support',
      '🔄 Progressive enhancement that maintains OK-OFFLINE\'s offline-first architecture'
    ],
    changed: [
      '🔍 SearchView completely enhanced with intelligent search mode selection',
      '🏗️ Search architecture now supports multiple backends with graceful fallbacks',
      '🎨 Improved search UI with better visual hierarchy and user experience',
      '⚡ Search performance optimized with debouncing and request cancellation'
    ],
    technical: [
      '🧩 New vectorSearchService.js for semantic search API integration',
      '🎨 Three new search components: SearchModeSelector, SearchResultItem, SearchSuggestions',
      '💾 IndexedDB caching strategy for vector search results with 24-hour TTL',
      '🔗 Rails API integration with PostgreSQL + pgvector backend',
      '🤖 OpenAI embeddings for intelligent semantic similarity matching'
    ]
  },
  {
    version: '3.7.0',
    date: '2025-07-27',
    added: [
      '🎯 Precise Camp Location Accuracy - Navigation-ready positioning system',
      '📍 GIS intersection finding algorithm places camps at exact street corners',
      '🗺️ Dynamic avenue mapping for year-specific naming themes (2024: wonder theme, 2025: sci-fi authors)',
      '📏 Accurate avenue distances extracted from GIS data (corrected errors up to 536 feet!)',
      '🎨 Custom Map Visualization with distinctive red streets on black background',
      '🏷️ Street name labels for easy orientation and navigation',
      '🧭 Smart Basemap Management - Year-specific map handling prevents confusion',
      '🔇 Conditional debug logging system for clean production console output'
    ],
    changed: [
      '🎯 Geocoding system now prioritizes GIS intersection finding over calculated positions',
      '🗺️ Map styling dynamically adapts based on year and basemap availability',
      '📍 DetailView includes GIS street layer initialization for accurate positioning',
      '🔧 Debug logging only enabled in development mode or with VITE_DEBUG=true'
    ],
    fixed: [
      '📍 Camp locations now appear at exact street intersections instead of approximate positions',
      '🗺️ Eliminated confusion from basemap showing wrong year\'s street names',
      '📏 Corrected hardcoded avenue distances with accurate GIS measurements from official data',
      '🔇 Reduced console noise in production while preserving detailed debugging information'
    ],
    technical: [
      '🧩 New avenueMapping.js utility for year-specific street name translation',
      '🔍 Enhanced geocoding.js with GIS intersection finding and distance validation',
      '🎨 Custom street rendering system for year-appropriate visualization',
      '🔧 APP_DEBUG configuration system for conditional logging'
    ]
  },
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
  margin: 0 !important;
  padding: 0;
  color: #fff;
  line-height: 1.2;
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