<template>
  <section id="settings-section" class="view">
    <div class="settings-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab"
        @click="activeTab = tab"
        :class="['tab-button', { active: activeTab === tab }]"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Data Sync Tab -->
    <div v-if="activeTab === 'Data Sync'" class="tab-content">
      <h2>Data Sync Settings</h2>
      
      <div class="sync-all-container">
        <button 
          @click="syncAllYears" 
          :disabled="syncingAll"
          class="sync-all-button"
        >
          {{ syncingAll ? 'Syncing All Years...' : 'Sync All Years' }}
        </button>
        <div v-if="syncingAll" class="sync-all-progress">
          {{ syncAllProgress }}
        </div>
      </div>
      
      <div class="settings-content">
        <div v-for="year in years" :key="year" class="year-section">
          <h3>{{ year }} Data</h3>
          
          <div class="sync-status">
            <div v-for="type in types" :key="type" class="status-row">
              <span class="type-label">{{ capitalize(type) }}s:</span>
              <span class="count">{{ syncStatus[year]?.[type]?.count || 0 }} items</span>
              <span class="last-sync" v-if="syncStatus[year]?.[type]?.lastSync">
                Last sync: {{ formatDate(syncStatus[year][type].lastSync) }}
              </span>
              <span class="never-synced" v-else>Never synced</span>
            </div>
          </div>
          
          <div class="sync-actions">
            <button 
              @click="syncYear(year)" 
              :disabled="syncing[year]"
              class="sync-button"
            >
              {{ syncing[year] ? 'Syncing...' : 'Sync All Data' }}
            </button>
            
            <button 
              @click="clearYear(year)"
              :disabled="syncing[year]"
              class="clear-button"
              v-if="syncStatus[year] && hasData(year)"
            >
              Clear Data
            </button>
          </div>
          
          <div v-if="progress[year]" class="progress-bar">
            <div class="progress-fill" :style="{ width: progress[year] + '%' }"></div>
            <span class="progress-text">{{ progressText[year] }}</span>
          </div>
        </div>
      </div>
      
      <div class="global-actions">
        <button @click="clearAllData" class="danger-button">
          Clear All Cached Data
        </button>
      </div>
    </div>

    <!-- About Tab -->
    <div v-if="activeTab === 'About'" class="tab-content about-content">
      <h2>About OK-OFFLINE</h2>
      
      <div class="about-section">
        <p>
          OK-OFFLINE is an offline-first Progressive Web App for Burning Man that lets you browse camps, 
          art installations, and events without connectivity.
        </p>
        
        <p>
          Created by <strong>Jeremy Roush</strong> and brought to you by <strong>Mr. OK of OKNOTOK</strong>.
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
    </div>

    <!-- Features Tab -->
    <div v-if="activeTab === 'Features'" class="tab-content features-content">
      <h2>Features</h2>
      
      <div class="feature-section">
        <h3>🗺️ Interactive Map</h3>
        <ul>
          <li>View camps, art, and events on the playa map</li>
          <li>Toggle layers to show/hide different types</li>
          <li>Filter to show only your favorites</li>
          <li>Click markers for quick details</li>
        </ul>
      </div>

      <div class="feature-section">
        <h3>📋 Smart Lists</h3>
        <ul>
          <li>Sort by name, location, sector, or distance</li>
          <li>Filter by sectors (clock positions)</li>
          <li>Live search as you type</li>
          <li>Collapsible section headers</li>
          <li>Track visited camps with badges</li>
        </ul>
      </div>

      <div class="feature-section">
        <h3>⭐ Personal Features</h3>
        <ul>
          <li><strong>Favorites</strong> - Star items to save them</li>
          <li><strong>Schedule Builder</strong> - Plan your burn with conflict detection</li>
          <li><strong>Visit Tracking</strong> - Mark camps as visited with notes</li>
          <li><strong>Emergency Info</strong> - Store contacts and medical details</li>
        </ul>
      </div>

      <div class="feature-section">
        <h3>🔍 Search & Navigation</h3>
        <ul>
          <li>Global search across all camps, art, and events</li>
          <li>Keyboard shortcuts (1-8 for quick nav)</li>
          <li>Location-based sorting when GPS enabled</li>
          <li>Direct links to share specific items</li>
        </ul>
      </div>

      <div class="feature-section">
        <h3>📱 Offline & PWA</h3>
        <ul>
          <li>Works completely offline once synced</li>
          <li>Install as an app on your device</li>
          <li>Fast loading and responsive design</li>
          <li>Dark theme for night use</li>
        </ul>
      </div>

      <div class="feature-section">
        <h3>🌪️ Playa Tools</h3>
        <ul>
          <li><strong>Dust Forecast</strong> - Check weather conditions</li>
          <li><strong>BRC Geocoding</strong> - Accurate address mapping</li>
          <li><strong>Event Locations</strong> - See where events happen</li>
          <li><strong>Distance Calculator</strong> - Know how far to bike</li>
        </ul>
      </div>

      <div class="keyboard-shortcuts">
        <h3>⌨️ Keyboard Shortcuts</h3>
        <table>
          <tbody>
            <tr><td><kbd>1</kbd></td><td>Go to Map</td></tr>
            <tr><td><kbd>2</kbd></td><td>Go to Camps</td></tr>
            <tr><td><kbd>3</kbd></td><td>Go to Art</td></tr>
            <tr><td><kbd>4</kbd></td><td>Go to Events</td></tr>
            <tr><td><kbd>5</kbd></td><td>Go to Search</td></tr>
            <tr><td><kbd>6</kbd></td><td>Go to Schedule</td></tr>
            <tr><td><kbd>7</kbd></td><td>Go to Emergency</td></tr>
            <tr><td><kbd>8</kbd></td><td>Go to Dust Forecast</td></tr>
            <tr><td><kbd>F</kbd></td><td>Toggle Favorites</td></tr>
            <tr><td><kbd>L</kbd></td><td>Toggle Layers (Map)</td></tr>
            <tr><td><kbd>/</kbd></td><td>Show Shortcuts</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Implementation Tab -->
    <div v-if="activeTab === 'Implementation'" class="tab-content implementation-content">
      <h2>Technical Implementation</h2>
      
      <div class="impl-section">
        <h3>Architecture</h3>
        <p>
          OK-OFFLINE follows a strict offline-first architecture:
        </p>
        <ul>
          <li>Data synced only through this settings page</li>
          <li>All views load exclusively from cache</li>
          <li>No background API calls</li>
          <li>Events enriched with location data during sync</li>
        </ul>
      </div>

      <div class="impl-section">
        <h3>Tech Stack</h3>
        <ul>
          <li><strong>Vue 3</strong> - Composition API for reactive UI</li>
          <li><strong>Vite</strong> - Fast build tool with HMR</li>
          <li><strong>Vue Router</strong> - Client-side routing</li>
          <li><strong>Leaflet</strong> - Interactive maps</li>
          <li><strong>IndexedDB</strong> - Offline data storage</li>
          <li><strong>Service Workers</strong> - PWA functionality</li>
        </ul>
      </div>

      <div class="impl-section">
        <h3>Data Storage</h3>
        <code>
Database: bm2025-db
├── art (object store)
│   ├── Key: uid
│   └── Index: year
├── camp (object store)
│   ├── Key: uid
│   └── Index: year
└── event (object store)
    ├── Key: uid
    └── Index: year
        </code>
      </div>

      <div class="impl-section">
        <h3>BRC Geocoding</h3>
        <p>
          Converts addresses like "7:30 & E" to coordinates:
        </p>
        <ol>
          <li>Parse clock position and avenue</li>
          <li>Account for 45° city rotation</li>
          <li>Calculate distance from Golden Spike</li>
          <li>Apply trigonometry for lat/lon</li>
        </ol>
      </div>

      <div class="impl-section">
        <h3>Event Enrichment</h3>
        <p>
          During sync, events are enriched with location data:
        </p>
        <ol>
          <li>Match events to camps via <code>hosted_by_camp</code></li>
          <li>Add <code>camp_name</code> and <code>enriched_location</code></li>
          <li>Fall back to <code>other_location</code> if no camp</li>
          <li>Preserve enrichment in cache</li>
        </ol>
      </div>

      <div class="impl-section">
        <h3>Performance</h3>
        <ul>
          <li>Lazy loaded views with code splitting</li>
          <li>Debounced search inputs</li>
          <li>Reactive computed properties</li>
          <li>Minimal bundle size (~500KB)</li>
        </ul>
      </div>

      <div class="impl-section">
        <h3>Contributing</h3>
        <p>
          View the full source code and contribute on GitHub:<br>
          <a href="https://github.com/jeremedia/ok-offline" target="_blank" rel="noopener">
            github.com/jeremedia/ok-offline
          </a>
        </p>
      </div>
    </div>

    <!-- Feedback Tab -->
    <div v-if="activeTab === 'Feedback'" class="tab-content feedback-content">
      <h2>Feedback & Support</h2>
      
      <div class="feedback-section">
        <h3>🐛 Report a Bug</h3>
        <p>
          Found something that's not working right? Let us know!
        </p>
        <a 
          href="https://github.com/jeremedia/ok-offline/issues/new?labels=bug&template=bug_report&title=[Bug]:%20" 
          target="_blank" 
          rel="noopener"
          class="feedback-link"
        >
          Report a Bug on GitHub →
        </a>
        
        <div class="feedback-tips">
          <p>When reporting a bug, please include:</p>
          <ul>
            <li>What you were trying to do</li>
            <li>What happened instead</li>
            <li>Your device type (phone/tablet/computer)</li>
            <li>Browser name and version</li>
            <li>Whether you were online or offline</li>
            <li>Any error messages you saw</li>
          </ul>
        </div>
      </div>

      <div class="feedback-section">
        <h3>✨ Request a Feature</h3>
        <p>
          Have an idea to make OK-OFFLINE even better? We'd love to hear it!
        </p>
        <a 
          href="https://github.com/jeremedia/ok-offline/issues/new?labels=enhancement&template=feature_request&title=[Feature]:%20" 
          target="_blank" 
          rel="noopener"
          class="feedback-link"
        >
          Request a Feature on GitHub →
        </a>
        
        <div class="feedback-tips">
          <p>When requesting a feature, consider:</p>
          <ul>
            <li>What problem it would solve</li>
            <li>How you envision it working</li>
            <li>Who would benefit from it</li>
            <li>Any examples from other apps</li>
          </ul>
        </div>
      </div>

      <div class="feedback-section">
        <h3>📋 View Existing Issues</h3>
        <p>
          Check out what others have reported or requested:
        </p>
        <a 
          href="https://github.com/jeremedia/ok-offline/issues" 
          target="_blank" 
          rel="noopener"
          class="feedback-link"
        >
          View All Issues on GitHub →
        </a>
      </div>

      <div class="feedback-section">
        <h3>💡 Contributing</h3>
        <p>
          OK-OFFLINE is open source! If you're a developer, you can contribute directly:
        </p>
        <ul>
          <li>Fork the repository</li>
          <li>Create a feature branch</li>
          <li>Make your changes</li>
          <li>Submit a pull request</li>
        </ul>
        <a 
          href="https://github.com/jeremedia/ok-offline" 
          target="_blank" 
          rel="noopener"
          class="feedback-link"
        >
          Visit the Repository →
        </a>
      </div>

      <div class="feedback-section">
        <h3>📧 Direct Contact</h3>
        <p>
          For sensitive issues or general feedback, you can also reach out directly through GitHub.
        </p>
        <p class="feedback-note">
          <strong>Note:</strong> OK-OFFLINE is a community project brought to you by Mr. OK of OKNOTOK. 
          Response times may vary, especially during the burn! 🔥
        </p>
      </div>
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
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { syncYear as syncYearData, getSyncStatus, clearYear as clearYearData } from '../services/dataSync'
import { clearCache } from '../services/storage'

// Tab management
const tabs = ['Data Sync', 'About', 'Features', 'Implementation', 'Feedback']
const activeTab = ref('Data Sync')

// App version
const appVersion = __APP_VERSION__
const buildTime = new Date(__BUILD_TIME__).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

// Release notes modal
const showReleaseNotes = ref(false)

// Release notes data
const releaseNotes = [
  {
    version: '1.1.0',
    date: '2025-01-26',
    added: [
      'Comprehensive in-app documentation with tabbed interface',
      'About tab with version display and build timestamp',
      'Features tab documenting all app capabilities',
      'Implementation tab with technical details',
      'Feedback tab with GitHub issue integration',
      'Automatic semantic versioning with CI/CD pipeline',
      'Version display in settings (click OK-OFFLINE header)'
    ],
    changed: [
      'Settings view transformed into multi-tab interface',
      'Updated attribution to Jeremy Roush and Mr. OK of OKNOTOK'
    ],
    fixed: [
      'Table HTML structure warnings (added tbody elements)'
    ]
  },
  {
    version: '1.0.0',
    date: '2025-01-26',
    added: [
      'Initial release of OK-OFFLINE',
      'Offline-first Progressive Web App for Burning Man',
      'Complete data sync for camps, art, and events (2023-2025)',
      'Interactive map with layer toggles',
      'Smart lists with sorting and filtering',
      'Personal schedule builder with conflict detection',
      'Favorites system across all data types',
      'Visit tracking with notes for camps',
      'Emergency contacts storage',
      'Search functionality across all content',
      'BRC geocoding for accurate address mapping',
      'Event location enrichment during sync',
      'Dust forecast widget',
      'Keyboard shortcuts for navigation',
      'PWA installation support',
      'Dark theme optimized for playa conditions'
    ],
    technical: [
      'Built with Vue 3 and Vite',
      'IndexedDB for offline storage',
      'Service Worker for PWA functionality',
      'Leaflet maps integration',
      'Strict offline-first architecture'
    ]
  }
]

// Original data sync logic
const years = ['2023', '2024', '2025']
const types = ['camp', 'art', 'event']
const syncStatus = ref({})
const syncing = ref({})
const progress = ref({})
const progressText = ref({})
const syncingAll = ref(false)
const syncAllProgress = ref('')

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

const hasData = (year) => {
  const status = syncStatus.value[year]
  if (!status) return false
  return types.some(type => status[type]?.count > 0)
}

const loadSyncStatus = async () => {
  for (const year of years) {
    syncStatus.value[year] = await getSyncStatus(year)
  }
}

const syncYear = async (year) => {
  if (syncing.value[year]) return
  
  syncing.value[year] = true
  progress.value[year] = 0
  progressText.value[year] = 'Starting sync...'
  
  try {
    await syncYearData(year, (type, current, total) => {
      const percent = Math.round((current / total) * 100)
      progress.value[year] = percent
      
      if (type === 'enriching') {
        progressText.value[year] = 'Enriching event locations...'
      } else if (type === 'complete') {
        progressText.value[year] = 'Complete!'
      } else {
        progressText.value[year] = `Syncing ${type}s...`
      }
    })
    
    // Reload sync status
    await loadSyncStatus()
    
    // Show complete message briefly
    setTimeout(() => {
      progress.value[year] = 0
      progressText.value[year] = ''
    }, 2000)
  } catch (err) {
    console.error('Sync failed:', err)
    progressText.value[year] = `Error: ${err.message}`
  } finally {
    syncing.value[year] = false
  }
}

const syncAllYears = async () => {
  if (syncingAll.value) return
  
  syncingAll.value = true
  
  for (let i = 0; i < years.length; i++) {
    const year = years[i]
    syncAllProgress.value = `Syncing ${year} (${i + 1} of ${years.length})...`
    await syncYear(year)
  }
  
  syncAllProgress.value = 'All years synced!'
  setTimeout(() => {
    syncingAll.value = false
    syncAllProgress.value = ''
  }, 2000)
}

const clearYear = async (year) => {
  if (confirm(`Are you sure you want to clear all ${year} data? This cannot be undone.`)) {
    await clearYearData(year)
    await loadSyncStatus()
  }
}

const clearAllData = async () => {
  if (confirm('Are you sure you want to clear ALL cached data? This cannot be undone.')) {
    await clearCache()
    localStorage.clear()
    await loadSyncStatus()
  }
}

onMounted(() => {
  loadSyncStatus()
})
</script>

<style scoped>
#settings-section {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;
  height: 100%;
}

.settings-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #444;
  flex-wrap: wrap;
}

.tab-button {
  background: none;
  border: none;
  color: #999;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #fff;
}

.tab-button.active {
  color: #fff;
  border-bottom-color: #8B0000;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

h2 {
  margin-bottom: 1.5rem;
  color: #fff;
}

h3 {
  color: #ccc;
  margin: 1.5rem 0 1rem;
}

/* Data Sync Tab Styles */
.sync-all-container {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
}

.sync-all-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.sync-all-button:hover:not(:disabled) {
  background: #a00000;
}

.sync-all-button:disabled {
  background: #666;
  cursor: not-allowed;
}

.sync-all-progress {
  margin-top: 0.5rem;
  color: #999;
}

.year-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.sync-status {
  margin-bottom: 1rem;
}

.status-row {
  display: grid;
  grid-template-columns: 100px 100px 1fr;
  gap: 1rem;
  padding: 0.5rem 0;
  align-items: center;
}

.type-label {
  font-weight: bold;
  color: #ccc;
}

.count {
  color: #fff;
}

.last-sync {
  color: #999;
  font-size: 0.9rem;
}

.never-synced {
  color: #666;
  font-style: italic;
}

.sync-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.sync-button {
  background: #444;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.sync-button:hover:not(:disabled) {
  background: #555;
}

.sync-button:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.clear-button {
  background: transparent;
  color: #ff6666;
  border: 1px solid #ff6666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover:not(:disabled) {
  background: #ff6666;
  color: #fff;
}

.progress-bar {
  margin-top: 1rem;
  height: 24px;
  background: #222;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B0000 0%, #a00000 50%, #8B0000 100%);
  background-size: 200% 100%;
  transition: width 0.3s ease;
  animation: shimmer 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(139, 0, 0, 0.5);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  white-space: nowrap;
}

.global-actions {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #444;
}

.danger-button {
  background: #ff4444;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.danger-button:hover {
  background: #ff6666;
}

/* About Tab Styles */
.about-content {
  max-width: 800px;
}

.about-section {
  margin-bottom: 2rem;
}

.about-section p {
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 1rem;
}

.about-section ul,
.about-section ol {
  margin-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.about-section a {
  color: #8B0000;
  text-decoration: none;
}

.about-section a:hover {
  text-decoration: underline;
}

.version-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1a1a1a;
  border-radius: 4px;
  font-size: 0.9rem;
}

.build-time {
  font-size: 0.8rem;
  color: #666;
}

/* Features Tab Styles */
.features-content {
  max-width: 900px;
}

.feature-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.feature-section h3 {
  margin-top: 0;
  color: #fff;
}

.feature-section ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.keyboard-shortcuts {
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 8px;
}

.keyboard-shortcuts table {
  width: 100%;
  border-collapse: collapse;
}

.keyboard-shortcuts td {
  padding: 0.5rem;
  border-bottom: 1px solid #444;
}

.keyboard-shortcuts kbd {
  background: #444;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
}

/* Implementation Tab Styles */
.implementation-content {
  max-width: 900px;
}

.impl-section {
  margin-bottom: 2rem;
}

.impl-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.impl-section ul,
.impl-section ol {
  margin-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.impl-section code {
  display: block;
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  color: #aaa;
  overflow-x: auto;
}

.impl-section a {
  color: #8B0000;
  text-decoration: none;
}

.impl-section a:hover {
  text-decoration: underline;
}

/* Feedback Tab Styles */
.feedback-content {
  max-width: 800px;
}

.feedback-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.feedback-section h3 {
  margin-top: 0;
  color: #fff;
}

.feedback-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.feedback-section ul {
  margin: 1rem 0 1rem 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.feedback-link {
  display: inline-block;
  background: #8B0000;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
  margin: 0.5rem 0;
}

.feedback-link:hover {
  background: #a00000;
  text-decoration: none;
}

.feedback-tips {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #444;
}

.feedback-tips p {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.feedback-note {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

/* Release Notes Button */
.release-notes-button {
  background: #444;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.release-notes-button:hover {
  background: #555;
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

@media (max-width: 768px) {
  #settings-section {
    padding: 0.5rem;
  }
  
  .settings-tabs {
    gap: 0.5rem;
  }
  
  .tab-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .status-row {
    grid-template-columns: 80px 80px 1fr;
    font-size: 0.9rem;
  }
  
  .sync-actions {
    flex-direction: column;
  }
}
</style>