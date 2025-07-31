<template>
  <div class="infrastructure-detail" v-if="item">
    <!-- Hero Section -->
    <InfrastructureHero :item="item" />

    <!-- Content Tabs -->
    <div class="content-tabs">
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="overview-content">
          <div class="description">
            <h3>About {{ item.name }}</h3>
            <p>{{ item.shortDescription }}</p>
          </div>
          
          <!-- Quick Facts -->
          <div class="quick-facts">
            <h4>Quick Facts</h4>
            <ul>
              <li v-for="(fact, index) in item.didYouKnow.slice(0, 3)" :key="index">
                {{ fact }}
              </li>
            </ul>
          </div>

          <!-- Location Map -->
          <div class="location-section" v-if="item.coordinates">
            <h4>Location{{ item.locations && item.locations.length > 1 ? 's' : '' }}</h4>
            <p v-if="!item.locations || item.locations.length === 0" class="location-coords">{{ formatCoordinates(item.coordinates) }}</p>
            <p v-else class="location-count">{{ item.locations.length }} locations throughout the city</p>
            <div class="mini-map" ref="mapContainer"></div>
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="history-content">
          <h3>Historical Context</h3>
          <p class="content-text">{{ item.history }}</p>
          
          <div class="timeline" v-if="item.timeline && item.timeline.length">
            <h4>Timeline</h4>
            <div class="timeline-items">
              <div v-for="event in item.timeline" :key="event.year" class="timeline-item">
                <span class="year">{{ event.year }}</span>
                <span class="event">{{ event.event }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operations Tab -->
        <div v-if="activeTab === 'operations'" class="operations-content">
          <div class="civic-purpose">
            <h3>Civic Purpose</h3>
            <p class="content-text">{{ item.civicPurpose }}</p>
          </div>
          
          <div class="operations">
            <h3>How It Operates</h3>
            <p class="content-text">{{ item.operations }}</p>
          </div>
        </div>

        <!-- Legal Tab -->
        <div v-if="activeTab === 'legal'" class="legal-content">
          <h3>Legal & Regulatory Context</h3>
          <p class="content-text">{{ item.legalContext }}</p>
          
          <div class="disclaimer">
            <p><em>This information is provided for educational purposes. Always refer to official Burning Man communications for current policies and regulations.</em></p>
          </div>
        </div>

        <!-- Fun Facts Tab -->
        <div v-if="activeTab === 'facts'" class="facts-content">
          <h3>Did You Know?</h3>
          <ul class="fun-facts">
            <li v-for="(fact, index) in item.didYouKnow" :key="index">
              {{ fact }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Related Links -->
    <div class="related-links" v-if="item.relatedLinks && item.relatedLinks.length">
      <h3>Learn More</h3>
      <div class="links-list">
        <a
          v-for="link in item.relatedLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="related-link"
        >
          {{ link.title }} →
        </a>
      </div>
    </div>

    <!-- Back Button -->
    <div class="back-nav">
      <button @click="goBack" class="back-btn">
        ← Back to Infrastructure
      </button>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="not-found">
    <h2>Infrastructure Not Found</h2>
    <p>The requested infrastructure item could not be found.</p>
    <button @click="goBack" class="back-btn">
      ← Back to Infrastructure
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import L from 'leaflet'
import InfrastructureHero from '../components/infrastructure/InfrastructureHero.vue'
import { getInfrastructureById } from '../services/infrastructure'

const props = defineProps({
  year: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})

const router = useRouter()
const route = useRoute()

// State
const item = ref(null)
const activeTab = ref('overview')
const mapContainer = ref(null)
let map = null

// Tab configuration
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'History' },
  { id: 'operations', label: 'Operations' },
  { id: 'legal', label: 'Legal' },
  { id: 'facts', label: 'Fun Facts' }
]

// Methods
const goBack = () => {
  router.push(`/${props.year}/infrastructure`)
}

const formatCoordinates = (coords) => {
  if (!coords || coords.length !== 2) return ''
  const lat = coords[0].toFixed(6)
  const lon = coords[1].toFixed(6)
  return `${lat}°N, ${lon}°W`
}

const initMap = async () => {
  if (!item.value?.coordinates || !mapContainer.value) return
  
  // Remove existing map if any
  if (map) {
    map.remove()
    map = null
  }
  
  await nextTick()
  
  // Initialize map
  map = L.map(mapContainer.value, {
    center: item.value.coordinates,
    zoom: 15,
    zoomControl: false,
    attributionControl: false
  })

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    opacity: 0.6
  }).addTo(map)

  // Check if this item has multiple locations
  if (item.value.locations && item.value.locations.length > 0) {
    // Create a feature group to hold all markers
    const markersGroup = L.featureGroup()
    
    // Add markers for each location
    item.value.locations.forEach(location => {
      // For perimeter points, use numbered emojis
      let iconContent = item.value.icon
      if (item.value.id === 'perimeter' && location.name) {
        const pointNumber = location.name.match(/Point (\d)/)?.[1]
        if (pointNumber) {
          const numberEmojis = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
          iconContent = numberEmojis[parseInt(pointNumber)] || iconContent
        }
      }
      
      const icon = L.divIcon({
        html: `<div style="font-size: 20px;">${iconContent}</div>`,
        iconSize: [30, 30],
        className: 'infrastructure-map-marker'
      })
      
      const marker = L.marker(location.coordinates, { icon })
        .bindPopup(`<strong>${location.name}</strong>${location.address ? '<br>' + location.address : ''}${location.notes ? '<br><em>' + location.notes + '</em>' : ''}`)
      
      // Add click handler to zoom to location
      marker.on('click', () => {
        map.setView(location.coordinates, 16, { animate: true })
      })
      
      // Add popup close handler to zoom back out
      marker.on('popupclose', () => {
        map.fitBounds(markersGroup.getBounds().pad(0.1), { animate: true })
      })
      
      markersGroup.addLayer(marker)
    })
    
    // Add all markers to map
    markersGroup.addTo(map)
    
    // Fit map bounds to show all markers
    map.fitBounds(markersGroup.getBounds().pad(0.1))
  } else {
    // Single location - use original code
    const icon = L.divIcon({
      html: `<div style="font-size: 24px;">${item.value.icon}</div>`,
      iconSize: [30, 30],
      className: 'infrastructure-map-marker'
    })

    L.marker(item.value.coordinates, { icon })
      .addTo(map)
      .bindPopup(item.value.name)
  }
}

// Lifecycle
onMounted(() => {
  // Scroll to top
  window.scrollTo(0, 0)
  
  // Load infrastructure data
  item.value = getInfrastructureById(props.id)
  
  // Initialize map when overview tab is active
  if (item.value && activeTab.value === 'overview') {
    nextTick(() => initMap())
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Watch for tab changes
watch(activeTab, async (newTab) => {
  if (newTab === 'overview' && item.value?.coordinates) {
    await nextTick()
    initMap()
  }
})
</script>

<style scoped>
.infrastructure-detail {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

.back-nav {
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: var(--color-bg-header);
  border-color: var(--color-bg-active);
  color: var(--color-text-primary);
}

.content-tabs {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: uppercase;
  font-size: 0.875rem;
}

.tab-btn:hover {
  background: var(--color-bg-header);
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.tab-content {
  padding: 2rem;
  max-width: none;
}

.content-text {
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

/* Overview styles */
.overview-content h3,
.history-content h3,
.operations-content h3,
.legal-content h3,
.facts-content h3 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.quick-facts h4 {
  margin-top: 1.5rem;
}

.quick-facts ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.fun-facts {
  list-style: none;
  padding: 0;
  margin-left: 0;
  margin-bottom: 0;
}

.quick-facts li,
.fun-facts li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
}

.quick-facts li:first-child {
  padding-top: 0;
}

.quick-facts li:before,
.fun-facts li:before {
  content: "→ ";
  color: var(--color-accent);
  font-weight: bold;
}

.location-coords,
.location-count {
  color: var(--color-text-secondary);
  margin: 0.5rem 0;
  font-family: 'Berkeley Mono', monospace;
}

.mini-map {
  height: 300px;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

/* Timeline styles */
.timeline-items {
  margin-top: 1rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.timeline-item .year {
  font-weight: bold;
  color: var(--color-accent);
  min-width: 60px;
}

.timeline-item .event {
  color: var(--color-text-secondary);
}

/* Operations styles */
.civic-purpose,
.operations {
  margin-bottom: 2rem;
}

.operations:last-child {
  margin-bottom: 0;
}

.operations p:last-child {
  margin-bottom: 0;
}

/* Legal styles */
.disclaimer {
  background: var(--color-bg-base);
  padding: 1rem;
  border-radius: 4px;
  margin-top: 2rem;
  border: 1px solid var(--color-border);
}

.disclaimer p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9em;
}

/* Related links */
.related-links {
  background: var(--color-bg-elevated);
  padding: 1.5rem;
  border-radius: 8px;
}

.related-links h3 {
  color: var(--color-text-primary);
  margin-top: 0;
  margin-bottom: 1rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-link {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s ease;
}

.related-link:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 3rem;
}

.not-found h2 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.not-found p {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

/* Mobile styles */
@media (max-width: 600px) {
  .infrastructure-detail {
    padding: 0.5rem;
  }
  
  .tab-content {
    padding: 1rem;
  }
  
  .tab-buttons {
    -webkit-overflow-scrolling: touch;
  }
  
  .mini-map {
    height: 200px;
  }
}
</style>