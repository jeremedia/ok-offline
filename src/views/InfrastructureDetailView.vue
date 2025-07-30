<template>
  <div class="infrastructure-detail" v-if="item">
    <!-- Hero Section -->
    <InfrastructureHero :item="item" />
    
    <!-- Navigation -->
    <div class="detail-nav">
      <button @click="goBack" class="back-btn">
        ← Back to Infrastructure
      </button>
    </div>

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
            <h4>Location</h4>
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
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
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

const initMap = async () => {
  if (!item.value?.coordinates || !mapContainer.value) return
  
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

  // Add marker
  const icon = L.divIcon({
    html: `<div style="font-size: 24px;">${item.value.icon}</div>`,
    iconSize: [30, 30],
    className: 'infrastructure-map-marker'
  })

  L.marker(item.value.coordinates, { icon })
    .addTo(map)
    .bindPopup(item.value.name)
}

// Lifecycle
onMounted(() => {
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
</script>

<style scoped>
.infrastructure-detail {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.detail-nav {
  margin-bottom: 1.5rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #333;
  border-color: #666;
  color: #fff;
}

.content-tabs {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 2rem;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #444;
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #333;
  color: #fff;
}

.tab-btn.active {
  background: #8B0000;
  color: #fff;
}

.tab-content {
  padding: 2rem;
}

.content-text {
  line-height: 1.6;
  color: #ddd;
  margin-bottom: 1.5rem;
}

/* Overview styles */
.overview-content h3,
.history-content h3,
.operations-content h3,
.legal-content h3,
.facts-content h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.quick-facts ul,
.fun-facts {
  list-style: none;
  padding: 0;
}

.quick-facts li,
.fun-facts li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #333;
  color: #ddd;
}

.quick-facts li:before,
.fun-facts li:before {
  content: "→ ";
  color: #8B0000;
  font-weight: bold;
}

.mini-map {
  height: 300px;
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
  border-bottom: 1px solid #333;
}

.timeline-item .year {
  font-weight: bold;
  color: #8B0000;
  min-width: 60px;
}

.timeline-item .event {
  color: #ddd;
}

/* Operations styles */
.civic-purpose,
.operations {
  margin-bottom: 2rem;
}

/* Legal styles */
.disclaimer {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 2rem;
  border: 1px solid #444;
}

.disclaimer p {
  margin: 0;
  color: #999;
  font-size: 0.9em;
}

/* Related links */
.related-links {
  background: #2a2a2a;
  padding: 1.5rem;
  border-radius: 8px;
}

.related-links h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.related-link {
  color: #8B0000;
  text-decoration: none;
  transition: color 0.2s ease;
}

.related-link:hover {
  color: #ff0000;
  text-decoration: underline;
}

/* Not found */
.not-found {
  text-align: center;
  padding: 3rem;
}

.not-found h2 {
  color: #fff;
  margin-bottom: 1rem;
}

.not-found p {
  color: #999;
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