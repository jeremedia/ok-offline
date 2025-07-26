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
          
          <div v-if="progress[year] || progressText[year]" class="progress-bar">
            <div class="progress-fill" :style="{ width: (progress[year] || 0) + '%' }"></div>
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

    <!-- Emergency Tab -->
    <div v-if="activeTab === 'Emergency'" class="tab-content emergency-content">
      <h2>🚨 Emergency Information</h2>
      
      <div class="emergency-header">
        <div class="emergency-number">
          <h3>Burning Man Emergency</h3>
          <a href="tel:911" class="emergency-tel">911</a>
          <small>For life-threatening emergencies on playa</small>
        </div>
        
        <div class="ranger-number">
          <h3>Black Rock Rangers</h3>
          <p class="ranger-info">Visit Ranger Outposts at 3:00, 6:00, 9:00 Plazas</p>
          <small>For non-emergency assistance</small>
        </div>
      </div>
      
      <div class="emergency-subtabs">
        <button 
          @click="emergencyTab = 'contacts'" 
          :class="['subtab-btn', { active: emergencyTab === 'contacts' }]"
        >
          Emergency Contacts
        </button>
        <button 
          @click="emergencyTab = 'medical'" 
          :class="['subtab-btn', { active: emergencyTab === 'medical' }]"
        >
          Medical Info
        </button>
        <button 
          @click="emergencyTab = 'resources'" 
          :class="['subtab-btn', { active: emergencyTab === 'resources' }]"
        >
          Resources
        </button>
      </div>
      
      <!-- Emergency Contacts Tab -->
      <div v-if="emergencyTab === 'contacts'" class="subtab-content">
        <h3>Your Emergency Contacts</h3>
        
        <div v-if="contacts.length === 0" class="empty-state">
          <p>No emergency contacts added yet.</p>
          <p class="hint">Add contacts who should be notified in case of emergency.</p>
        </div>
        
        <ul v-else class="contacts-list">
          <li v-for="contact in contacts" :key="contact.id" class="contact-item">
            <div class="contact-info">
              <h4>{{ contact.name }}</h4>
              <p>{{ contact.relationship }}</p>
              <a :href="`tel:${contact.phone}`" class="contact-phone">{{ contact.phone }}</a>
              <p v-if="contact.notes" class="contact-notes">{{ contact.notes }}</p>
            </div>
            <button @click="removeContact(contact.id)" class="remove-btn">✕</button>
          </li>
        </ul>
        
        <button @click="showAddContact = !showAddContact" class="add-btn">
          {{ showAddContact ? 'Cancel' : '+ Add Contact' }}
        </button>
        
        <form v-if="showAddContact" @submit.prevent="addContact" class="add-form">
          <input 
            v-model="newContact.name" 
            placeholder="Name" 
            required
            class="form-input"
          />
          <input 
            v-model="newContact.relationship" 
            placeholder="Relationship (e.g., Spouse, Parent)" 
            required
            class="form-input"
          />
          <input 
            v-model="newContact.phone" 
            type="tel" 
            placeholder="Phone Number" 
            required
            class="form-input"
          />
          <textarea 
            v-model="newContact.notes" 
            placeholder="Additional notes (optional)"
            class="form-textarea"
          ></textarea>
          <button type="submit" class="submit-btn">Add Contact</button>
        </form>
      </div>
      
      <!-- Medical Info Tab -->
      <div v-if="emergencyTab === 'medical'" class="subtab-content">
        <h3>Your Medical Information</h3>
        
        <form @submit.prevent="saveMedicalInfo" class="medical-form">
          <div class="form-group">
            <label>Blood Type</label>
            <select v-model="medicalInfo.bloodType" class="form-select">
              <option value="">Select...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Allergies</label>
            <textarea 
              v-model="medicalInfo.allergies" 
              placeholder="List any allergies (medications, food, environmental)"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Current Medications</label>
            <textarea 
              v-model="medicalInfo.medications" 
              placeholder="List current medications and dosages"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Medical Conditions</label>
            <textarea 
              v-model="medicalInfo.conditions" 
              placeholder="List any medical conditions"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Emergency Notes</label>
            <textarea 
              v-model="medicalInfo.emergencyNotes" 
              placeholder="Any other important medical information"
              class="form-textarea"
            ></textarea>
          </div>
          
          <button type="submit" class="submit-btn">Save Medical Info</button>
        </form>
      </div>
      
      <!-- Resources Tab -->
      <div v-if="emergencyTab === 'resources'" class="subtab-content">
        <h3>Emergency Resources</h3>
        
        <div class="resource-section">
          <h4>Medical Stations</h4>
          <ul class="resource-list">
            <li>Center Camp Medical (5:45 & Esplanade)</li>
            <li>3:00 Medical (3:00 & C)</li>
            <li>9:00 Medical (9:00 & C)</li>
            <li>Rampart Medical (4:30 & H)</li>
          </ul>
        </div>
        
        <div class="resource-section">
          <h4>Important Radio Channels</h4>
          <ul class="resource-list">
            <li>BMIR 94.5 FM - Burning Man Information Radio</li>
            <li>Emergency Channel: Contact Rangers</li>
          </ul>
        </div>
        
        <div class="resource-section">
          <h4>Safety Tips</h4>
          <ul class="resource-list">
            <li>Stay hydrated - drink water regularly</li>
            <li>Use sunscreen and protective clothing</li>
            <li>Never travel alone at night</li>
            <li>Know your camp location and landmarks</li>
            <li>Have a meetup plan with your campmates</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Maps Tab -->
    <div v-if="activeTab === 'Maps'" class="tab-content maps-content">
      <h2>Map & GIS Settings</h2>
      
      <div class="maps-section">
        <h3>🗺️ Map Information</h3>
        <p>
          Explore detailed Black Rock City geographic information and mapping features.
        </p>
        
        <router-link to="/settings/map" class="maps-link">
          🔍 View Detailed Map Information →
        </router-link>
        
        <div class="maps-info">
          <h4>What you'll find:</h4>
          <ul>
            <li><strong>BRC Geometry</strong> - City dimensions, street layout, and orientation facts</li>
            <li><strong>GIS Data Sources</strong> - Information about streets, boundaries, and points of interest</li>
            <li><strong>Technical Details</strong> - Coordinate systems, data formats, and update schedules</li>
            <li><strong>Fun Facts</strong> - Interesting details about Black Rock City's unique urban design</li>
          </ul>
        </div>
      </div>

      <div class="maps-section">
        <h3>🧭 Map Controls</h3>
        <p>
          The map view includes advanced controls for exploring Black Rock City:
        </p>
        <ul>
          <li><strong>Layer Toggles</strong> - Show/hide streets, city blocks, trash fence, and points of interest</li>
          <li><strong>City Alignment</strong> - Rotate the map to align gate at bottom, temple at top</li>
          <li><strong>Base Map Toggle</strong> - Show/hide satellite imagery for better visibility</li>
          <li><strong>Interactive Legend</strong> - Understand what each symbol and color represents</li>
        </ul>
      </div>

      <div class="maps-section">
        <h3>📍 GIS Data Features</h3>
        <div class="gis-features-grid">
          <div class="gis-feature">
            <h4>🛣️ Street Network</h4>
            <p>Complete street layout including radial streets (2:00-10:00) and circular avenues (Esplanade-L)</p>
          </div>
          
          <div class="gis-feature">
            <h4>🚧 City Boundary</h4>
            <p>Trash fence perimeter defining the official city limits and safety boundary</p>
          </div>
          
          <div class="gis-feature">
            <h4>🏗️ City Blocks</h4>
            <p>Individual parcels showing camp placement and city organization</p>
          </div>
          
          <div class="gis-feature">
            <h4>📍 Points of Interest</h4>
            <p>Plazas, CPN locations, and other important community spaces</p>
          </div>
        </div>
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
          <li><strong>Emergency Info</strong> - Store contacts and medical details (Emergency tab)</li>
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
            <tr><td><kbd>7</kbd></td><td>Go to Dust Forecast</td></tr>
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
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { syncYear as syncYearData, getSyncStatus, clearYear as clearYearData } from '../services/staticDataSync'
import { clearCache } from '../services/storage'
import { useToast } from '../composables/useToast'
import { getErrorMessage } from '../utils/errorHandler'

// Tab management
const tabs = ['Data Sync', 'Emergency', 'Maps', 'About', 'Features', 'Implementation', 'Feedback']
const activeTab = ref(localStorage.getItem('settingsTab') || 'Data Sync')

// Save tab selection when it changes
watch(activeTab, (newTab) => {
  localStorage.setItem('settingsTab', newTab)
})

// Toast notifications
const { showSuccess, showError, showWarning } = useToast()

// Emergency functionality constants
const CONTACTS_KEY = 'bm_emergency_contacts'
const MEDICAL_KEY = 'bm_medical_info'

// Emergency tab state
const emergencyTab = ref('contacts')
const contacts = ref([])
const showAddContact = ref(false)
const newContact = ref({
  name: '',
  relationship: '',
  phone: '',
  notes: ''
})

const medicalInfo = ref({
  bloodType: '',
  allergies: '',
  medications: '',
  conditions: '',
  emergencyNotes: ''
})

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
      'User-friendly error messages for sync failures'
    ],
    changed: [
      'Replaced API proxy with static JSON data files',
      'Removed dependency on live API calls',
      'Simplified sync process'
    ],
    fixed: [
      'CORS issues with Burning Man API',
      'Toast notification timing issues'
    ]
  },
  {
    version: '1.2.3',
    date: '2025-01-26',
    fixed: [
      'Loading states and error handling improvements',
      'Visual feedback during sync operations'
    ]
  },
  {
    version: '1.2.2',
    date: '2025-01-26',
    added: [
      'Loading spinner component with animated feedback',
      'Skeleton loader component for list views',
      'Toast notification system for user feedback',
      'Comprehensive error handling with user-friendly messages',
      'Retry functionality for failed data loads',
      'Success notifications for sync operations',
      'Empty state messages with helpful hints',
      'Enhanced progress bars with gradient animations'
    ],
    changed: [
      'Improved sync progress visualization',
      'Better error messages for network and API failures',
      'Enhanced user feedback during operations'
    ],
    fixed: [
      'Error states now show actionable messages',
      'Loading states properly displayed during data fetches'
    ]
  },
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
    // Show success notification
    showSuccess(`Successfully synced ${year} data!`)
  } catch (err) {
    console.error('Sync failed:', err)
    const errorMessage = getErrorMessage(err)
    progressText.value[year] = `Error: ${errorMessage}`
    showError(errorMessage)
    // Clear progress after showing error
    setTimeout(() => {
      progress.value[year] = 0
      progressText.value[year] = ''
    }, 3000)
    throw err  // Re-throw for syncAllYears to handle
  } finally {
    syncing.value[year] = false
  }
}

const syncAllYears = async () => {
  if (syncingAll.value) return
  
  syncingAll.value = true
  let successCount = 0
  let failedYears = []
  
  try {
    for (let i = 0; i < years.length; i++) {
      const year = years[i]
      syncAllProgress.value = `Syncing ${year} (${i + 1} of ${years.length})...`
      
      try {
        await syncYear(year)
        successCount++
      } catch (err) {
        console.error(`Failed to sync ${year}:`, err)
        failedYears.push(year)
        // Continue with other years even if one fails
      }
    }
    
    // Show appropriate message based on results
    if (successCount === years.length) {
      syncAllProgress.value = 'All years synced!'
      showSuccess('Successfully synced all years!')
    } else if (successCount > 0) {
      syncAllProgress.value = `Partially synced (${successCount} of ${years.length})`
      showWarning(`Synced ${successCount} year(s). Failed: ${failedYears.join(', ')}`)
    } else {
      syncAllProgress.value = 'Sync failed'
      showError('Unable to sync any data. Please check your connection.')
    }
  } catch (err) {
    console.error('Unexpected error during sync all:', err)
    syncAllProgress.value = 'Sync failed'
    showError('An unexpected error occurred. Please try again.')
  } finally {
    // Always reset the button state
    setTimeout(() => {
      syncingAll.value = false
      syncAllProgress.value = ''
    }, 3000)
  }
}

const clearYear = async (year) => {
  if (confirm(`Are you sure you want to clear all ${year} data? This cannot be undone.`)) {
    try {
      await clearYearData(year)
      await loadSyncStatus()
      showSuccess(`Cleared all ${year} data`)
    } catch (err) {
      console.error('Failed to clear data:', err)
      showError('Failed to clear data. Please try again.')
    }
  }
}

const clearAllData = async () => {
  if (confirm('Are you sure you want to clear ALL cached data? This cannot be undone.')) {
    try {
      await clearCache()
      localStorage.clear()
      await loadSyncStatus()
      showSuccess('All cached data cleared')
    } catch (err) {
      console.error('Failed to clear all data:', err)
      showError('Failed to clear data. Please try again.')
    }
  }
}

// Emergency functionality
const loadEmergencyData = () => {
  // Load contacts
  const savedContacts = localStorage.getItem(CONTACTS_KEY)
  if (savedContacts) {
    contacts.value = JSON.parse(savedContacts)
  }
  
  // Load medical info
  const savedMedical = localStorage.getItem(MEDICAL_KEY)
  if (savedMedical) {
    medicalInfo.value = JSON.parse(savedMedical)
  }
}

const saveContacts = () => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.value))
}

const addContact = () => {
  if (newContact.value.name && newContact.value.phone) {
    contacts.value.push({
      id: Date.now(),
      ...newContact.value
    })
    saveContacts()
    
    // Reset form
    newContact.value = {
      name: '',
      relationship: '',
      phone: '',
      notes: ''
    }
    showAddContact.value = false
    showSuccess('Emergency contact added')
  }
}

const removeContact = (id) => {
  contacts.value = contacts.value.filter(c => c.id !== id)
  saveContacts()
  showSuccess('Contact removed')
}

const saveMedicalInfo = () => {
  localStorage.setItem(MEDICAL_KEY, JSON.stringify(medicalInfo.value))
  showSuccess('Medical information saved')
}

onMounted(() => {
  loadSyncStatus()
  loadEmergencyData()
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

/* Maps Tab Styles */
.maps-content {
  max-width: 900px;
}

.maps-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.maps-section h3 {
  margin-top: 0;
  color: #fff;
}

.maps-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.maps-section ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.maps-link {
  display: inline-block;
  background: #8B0000;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
  margin: 1rem 0;
  font-weight: 500;
}

.maps-link:hover {
  background: #a00000;
  text-decoration: none;
}

.maps-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #444;
}

.maps-info h4 {
  color: #fff;
  margin: 0 0 0.75rem 0;
}

.gis-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.gis-feature {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #444;
}

.gis-feature h4 {
  color: #FFD700;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.gis-feature p {
  margin: 0;
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.5;
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

/* Emergency Tab Styles */
.emergency-content {
  max-width: 800px;
}

.emergency-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.emergency-number, .ranger-number {
  background: #2a2a2a;
  border: 2px solid #8B0000;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.emergency-number h3, .ranger-number h3 {
  color: #fff;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.emergency-tel {
  font-size: 2rem;
  color: #ff0000;
  text-decoration: none;
  font-weight: bold;
  display: block;
  margin: 0.5rem 0;
}

.ranger-info {
  color: #ccc;
  margin: 0.5rem 0;
}

.emergency-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #444;
}

.subtab-btn {
  background: none;
  border: none;
  color: #999;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.subtab-btn:hover {
  color: #ccc;
}

.subtab-btn.active {
  color: #fff;
  border-bottom-color: #8B0000;
}

.subtab-content {
  animation: fadeIn 0.3s;
}

.contacts-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.contact-item {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.contact-info h4 {
  color: #fff;
  margin: 0 0 0.25rem 0;
}

.contact-info p {
  color: #999;
  margin: 0.25rem 0;
}

.contact-phone {
  color: #4a9eff;
  text-decoration: none;
}

.contact-notes {
  font-size: 0.9rem;
  font-style: italic;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
}

.remove-btn:hover {
  color: #ff6b6b;
}

.add-btn {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #8B0000;
  color: #fff;
}

.add-form, .medical-form {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.emergency-content .form-input, 
.emergency-content .form-textarea, 
.emergency-content .form-select {
  width: 100%;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-family: inherit;
  font-size: 1rem;
}

.emergency-content .form-textarea {
  min-height: 80px;
  resize: vertical;
}

.emergency-content .form-group {
  margin-bottom: 1.5rem;
}

.emergency-content .form-group label {
  display: block;
  color: #ccc;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.emergency-content .submit-btn {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.emergency-content .submit-btn:hover {
  background: #a00000;
}

.resource-section {
  margin-bottom: 2rem;
}

.resource-section h4 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resource-list li {
  color: #ccc;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
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
  
  .emergency-header {
    grid-template-columns: 1fr;
  }
  
  .emergency-subtabs {
    flex-wrap: wrap;
  }
  
  .subtab-btn {
    flex: 1;
    min-width: 100px;
  }
}
</style>