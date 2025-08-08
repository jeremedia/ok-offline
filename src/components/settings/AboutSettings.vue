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
      
      <BaseButton @click="openReleaseNotes" variant="primary" :loading="loadingReleases">
        📋 View Release Notes
      </BaseButton>
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
          <BaseButton @click="showReleaseNotes = false" variant="ghost" size="sm">×</BaseButton>
        </div>
        <div class="modal-body">
          <div v-if="loadingReleases" class="loading-state">
            <p>Loading release notes...</p>
          </div>
          <div v-else-if="releaseNotes.length === 0" class="empty-state">
            <p>No release notes available.</p>
          </div>
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
import { BaseButton } from '@/components/ui'
import { loadReleaseNotes } from '@/services/releaseNotesService'

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
const loadingReleases = ref(false)
const releaseNotes = ref([])

// Load release notes when modal opens
const openReleaseNotes = async () => {
  showReleaseNotes.value = true
  if (releaseNotes.value.length === 0 && !loadingReleases.value) {
    loadingReleases.value = true
    try {
      releaseNotes.value = await loadReleaseNotes(20) // Load recent 20 releases
    } catch (error) {
      console.error('Failed to load release notes:', error)
    } finally {
      loadingReleases.value = false
    }
  }
}

// Auto-show release notes if prop is true
onMounted(async () => {
  if (props.showReleaseNotes) {
    openReleaseNotes()
  }
})

// Legacy release notes - now loaded from JSONL
// (keeping for reference during migration)
const legacyReleaseNotes = [
  {
    version: '3.25.1',
    date: '2025-08-02',
    added: [],
    fixed: [
      '🖥️ Desktop Detail View Layout - Improved spacing and alignment',
      '📱 Mobile Detail View - Restored single-column layout',
      '🗺️ Map Tooltips - Cleaner, less redundant messaging'
    ],
    changed: []
  },
  {
    version: '3.25.0',
    date: '2025-08-02',
    added: [
      '🚨 Emergency-Ready Khaki Theme - Complete redesign for Rangers & staff',
      '🌤️ Major Weather UI Enhancements - Accordion system and Light Cycle countdowns',
      '🎛️ Complete UI Component System - BaseButton, BaseCard, ButtonGroup foundation',
      '📱 Enhanced Mobile Experience - Body-level mobile class system and better touch targets'
    ],
    fixed: [
      '🖥️ Desktop Scrolling Architecture - Fixed 36px overflow and double-scrolling',
      '🔘 Button Standardization - All buttons migrated to BaseButton for consistency',
      '🗂️ List View Improvements - Section headers with thick borders and clear hierarchy',
      '🎨 Secondary button contrast enhanced for khaki theme visibility'
    ],
    changed: [
      '🎨 Khaki theme transformed from earth tones to high-contrast professional',
      '📐 Layout Architecture - Modern flexbox-based design with percentage heights',
      '🌤️ Weather display with Apple WeatherKit integration and trend indicators',
      '🚨 Emergency color coding: Green=Safe, Yellow=Caution, Orange=Warning, Red=Danger'
    ]
  },
  {
    version: '3.24.0',
    date: '2025-08-01',
    added: [
      '🔔 Toast Notifications - Visual feedback when adding/removing favorites',
      '🎨 Mobile Theme Selector - Quick theme switching in mobile menu',
      '✨ Theme-aware toast colors that adapt to current theme'
    ],
    fixed: [
      '📱 Mobile Detail View Polish - Refined spacing and layout',
      '⭐ Favorite star alignment optimized without expanding line height',
      '🔲 Back-to-list button styled with proper theme colors',
      '🎯 Map controls padding reduced for compact layout',
      '🎨 Toast notifications now use theme CSS variables'
    ],
    changed: [
      '📐 Consistent 16px spacing rhythm throughout mobile layout',
      '🗺️ Map controls background uses elevated surface color'
    ]
  },
  {
    version: '3.23.0',
    date: '2025-08-01',
    added: [
      '📱 Mobile UX Enhancements - Major improvements to mobile interface',
      '🎯 Map nav button toggles controls when already on map view',
      '👆 Swipe down gesture to close MapBottomSheet',
      '👍 Tabs moved to bottom for better thumb accessibility',
      '🗺️ Map remembers zoom, center, and rotation (24hr cache)',
      '🔍 Fractional zoom support for perfect trash fence fit',
      '🏛️ Infrastructure layer management improvements'
    ],
    fixed: [
      '📜 Desktop scrolling architecture completely refactored',
      '📏 Fixed mobile header height and eliminated white gaps',
      '🗺️ MapBottomSheet properly positioned above bottom nav',
      '🚽 Porto pins now properly removed when infrastructure unchecked',
      '🔴 Trash fence visibility fixed with bright red styling',
      '☑️ All checkboxes properly update when map is reset',
      '🎨 Art detail links fixed (/arts/ → /art/)',
      '🏠 AppFooter now desktop-only as intended'
    ],
    changed: [
      '🎯 Reset Map shows minimal view: streets and trash fence only',
      '⚫ Reset Map disables basemap for striking black background',
      '📍 Reset Map button moved to Display tab',
      '🧩 App.vue decomposed into maintainable components',
      '📐 BottomNav uses flexbox instead of fixed positioning'
    ]
  },
  {
    version: '3.22.0',
    date: '2025-07-31',
    added: [
      '🎨 Complete Theme System Overhaul - Professional 4-theme design system',
      '🎭 OKNOTOK Theme: Dark red/gold classic camp theme',
      '💖 Sparkle Pony Theme: Light Barbie pink theme with magical colors',
      '🏜️ Khaki Theme: Desert earth tones optimized for bright sunlight',
      '🍄 Mush Love Theme: Dark psychedelic theme with electric lime accents',
      '⚡ Dynamic theme switching with instant visual feedback',
      '♿ Proper contrast ratios ensuring readability in all lighting conditions',
      '🌈 Theme-aware overlays, shadows, and transparency effects'
    ],
    fixed: [
      '🔧 Theme Contrast Issues - Resolved low contrast across all themes',
      '✅ Tab buttons and search controls use proper textInverse colors',
      '🎯 OKNOTOK theme uses white text on red backgrounds for readability',
      '💡 Mush Love theme uses electric lime text on purple backgrounds',
      '🎨 Eliminated all hardcoded color values for complete theme consistency',
      '🔄 Replaced 25+ instances of hardcoded colors with theme variables',
      '🌟 RGBA color values modernized to use theme-appropriate alpha values',
      '📱 Select dropdown UI with modern SVG arrow and proper spacing',
      '🎛️ Component style consistency across settings and search components'
    ],
    changed: [
      '🏗️ Theme Architecture - Complete CSS variable system for maintainable theming',
      '🎨 All components use semantic theme variables instead of hardcoded values',
      '🌈 Background overlays adapt to light vs dark themes appropriately',
      '⚙️ Interactive states (hover, active, focus) properly themed across all components'
    ]
  },
  {
    version: '3.21.0',
    date: '2025-07-31',
    added: [
      '🏕️ Collapsible CAMP EVENTS - Lazy-loading events section with event count display',
      '🔢 Shows "CAMP EVENTS (20)" format with expand/collapse functionality',
      '⚡ Only loads events when expanded for better performance',
      '💾 Remembers open/closed state per camp using localStorage',
      '🗺️ Detail View Map Polish - Fixed scroll conflicts and added proper orientation',
      '🔄 Added -45° rotation for Burning Man orientation (gate at bottom)',
      '🔍 Manual zoom controls (+/-) that maintain marker centering',
      '📐 Enhanced Layout - Grouped related fields on single lines',
      '🎨 Added item type icons to headers (🏕️ camps, 🎨 art, 🎪 events)',
      '📱 Responsive flexbox layout with optimized mobile display'
    ],
    fixed: [
      '🐛 Fixed scroll wheel zoom conflicts with page scrolling',
      '📍 Fixed event location display to show host camp location',
      '🚫 Removed hover background color on camp event items'
    ]
  },
  {
    version: '3.20.0',
    date: '2025-07-31',
    added: [
      '🔍 Interactive Entity Discovery - Click entity tags to find related content',
      '📊 Entity tags show global counts (e.g., "music (411)")',
      '🎯 Smart sorting by relevance - most frequent entities first',
      '🌟 Popular Entities section with trending tags',
      '📈 Entity Breakdown showing counts across all types',
      '🔗 URL state management for shareable entity searches',
      '🏗️ Infrastructure search type with search and sort capabilities',
      '✅ "Everything" filter with smart toggle behavior',
      '💾 Persistent filter preferences saved in localStorage',
      '📝 Total items searched count display',
      '🔄 Auto-submit and auto-rerun search functionality',
      '💬 Dynamic placeholder text reflecting selected filters'
    ]
  },
  {
    version: '3.19.0',
    date: '2025-07-31',
    added: [
      '🎨 PWA Icon System Overhaul - Complete redesign of all app icons using AI',
      '🤖 Implemented gpt-image-1 model with OpenAI Responses API',
      '🔴 Uses OKNOTOK logo as reference for consistent branding',
      '📱 Generated new app icons in all sizes (16x16 to 1024x1024)',
      '🏜️ Desert/playa themed background textures on all icons',
      '📸 New social media preview images with dark theme',
      '👁️ IconViewer component at /icon_viewer to display all assets',
      '📋 Shows icon usage, sizes, and meta tag examples'
    ],
    changed: [
      '🔧 Modernized generate-pwa-images.js to use OpenAI SDK',
      '🖼️ Added image reference capability for brand consistency',
      '🎯 Support for both gpt-image-1 and dall-e-3 models',
      '⚡ Better error handling and progress feedback'
    ]
  },
  {
    version: '3.18.0',
    date: '2025-07-30',
    added: [
      '🔍 Interactive Entity Discovery - Click entity tags to explore related content',
      '📊 Entity tags show global counts (e.g., "music (411)")',
      '🎯 Smart sorting by relevance in current search results',
      '🔥 Popular Entities section with trending discovery tags',
      '📈 Entity Breakdown showing counts by type',
      '🎨 Clean entity search UI with accurate result counts',
      '🔗 Shareable entity search URLs (?entity=music)',
      '⬆️ Smooth scroll-to-top on new searches'
    ],
    fixed: [
      '🚫 Search mode changes no longer disable all filters',
      '✅ At least one filter always remains selected',
      '💾 Filter preferences persist across mode changes'
    ]
  },
  {
    version: '3.17.0',
    date: '2025-07-30',
    added: [
      '🔍 Enhanced Search UI - Comprehensive improvements to search interface and user experience',
      '🏛️ Infrastructure search type with full search and sort capabilities',
      '🎯 "Everything" filter with smart toggle behavior for intuitive filter selection',
      '💾 Persistent filter preferences automatically saved and restored',
      '📊 Total items searched count displayed alongside results for better context',
      '⚡ Auto-submit search when page loads with query parameter for shareable searches',
      '🔄 Auto-rerun search when changing between Keyword/Semantic/Smart modes',
      '💬 Dynamic placeholder text reflecting current filter selection',
      '🎯 Auto-focus search input when empty for better user experience',
      '🎨 Collapsible search options panel with horizontal button group layout',
      '📱 Mobile-optimized icon-only filter buttons with proper touch targets',
      '🧩 Decomposed search UI into logical, reusable components'
    ],
    fixed: [
      '🔄 Fixed loading spinner CSS conflict causing entire container to rotate',
      '🌈 Corrected HDR screen color issues by reducing red brightness by 25%',
      '🎨 Updated all border colors to match new dark red theme',
      '🧹 Removed redundant cache status messages and excess spacing',
      '⚙️ Fixed v-model prop binding errors in search components',
      '📐 Cleaned up search interface padding and margin inconsistencies'
    ],
    changed: [
      '🏗️ Modular search component architecture for better maintainability',
      '🚀 Changed Smart search icon from lightning bolt to rocket ship',
      '🔤 Uppercased all button text for consistent design language',
      '🎨 Implemented CSS variables for consistent dark red theming'
    ],
    technical: [
      '🧩 Created SearchInput.vue, UnifiedSearchBar.vue, and SearchOptions.vue components',
      '🎨 CSS variables for consistent color theming across components',
      '📱 Responsive design with separate mobile and desktop layouts',
      '💾 LocalStorage integration for persistent user preferences',
      '🧠 Smart toggle logic for intuitive filter interactions'
    ]
  },
  {
    version: '3.16.0',
    date: '2025-07-30',
    added: [
      '🏛️ Infrastructure Navigation - New INFRA section with comprehensive information about core Burning Man projects',
      '📚 13 infrastructure projects documented with historical context and civic purpose',
      '🎓 Educational content for both new and experienced burners',
      '🗂️ Organized by category: Civic Structures, City Services, Commerce, and Infrastructure',
      '📑 Tabbed detail views with Overview, History, Operations, Legal, and Fun Facts',
      '🗺️ Mini-map integration showing infrastructure locations',
      '📱 Mobile Navigation Overhaul - Complete redesign for better user experience',
      '☰ Hamburger menu with slide-out panel accessing all navigation options',
      '🎨 Unified design system with golden accents and button groups',
      '📊 Bottom navigation bar redesigned with tab-style active states',
      '✨ Settings panel improvements with Features link and better contrast'
    ],
    fixed: [
      '📜 Mobile menu scroll lock fixed using nextTick for reliable behavior',
      '⚡ Hamburger icon vertical centering corrected',
      '🔗 All settings panel links changed to gold for better contrast'
    ],
    technical: [
      '🏗️ New infrastructure data service and static JSON data structure',
      '🎨 Created InfrastructureView and InfrastructureDetailView components',
      '📱 Mobile menu state management with Vue 3 Composition API',
      '🎯 Touch targets optimized at 44px minimum',
      '🌈 CSS variables for consistent theming (--color-gold)'
    ]
  },
  {
    version: '3.15.0',
    date: '2025-07-29',
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
  color: var(--color-text-disabled);
}

/* Link styling */
.about-section a {
  color: var(--color-accent);
  text-decoration: none;
  transition: all 0.2s ease;
}

.about-section a:hover {
  text-decoration: underline;
  opacity: 0.9;
}

/* List styling */
.about-section ul,
.about-section ol {
  margin-left: 0;
  padding-left: 0;
  list-style: none;
}

.about-section li {
  position: relative;
  padding-left: 1.25rem;
}

.about-section ul li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--color-accent);
}

.about-section ol {
  counter-reset: item;
}

.about-section ol li {
  counter-increment: item;
}

.about-section ol li::before {
  content: counter(item) ".";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: 600;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-base);
  border-radius: 8px;
  max-width: 800px;
  max-height: 90vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px var(--color-overlay-dark);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-medium);
}

.modal-header h2 {
  margin: 0 !important;
  padding: 0;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 2rem;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-button:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.release-section {
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--color-border-light);
}

.release-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.release-section h3 {
  color: var(--color-text-primary);
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
}

.release-group {
  margin-bottom: 1.5rem;
}

.release-group h4 {
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.release-group ul {
  margin: 0;
  padding-left: 1.5rem;
  color: var(--color-text-muted);
  line-height: 1.8;
}

.release-group li {
  margin-bottom: 0.25rem;
}

/* Camp link styling */
.camp-link {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.camp-link:hover {
  color: var(--color-error);
  text-decoration: underline;
}

/* Loading and empty states */
.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-muted);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-state::before {
  content: '';
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-border-light);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>