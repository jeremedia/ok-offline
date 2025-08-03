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
const releaseNotes = ref([])
const loadingReleases = ref(false)

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
    await openReleaseNotes()
  }
})

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