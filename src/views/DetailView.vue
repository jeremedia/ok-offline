<template>
  <section id="detail-section" class="view">
    <div id="detail-content" v-if="item">
      <!-- Mobile title - shown above map on mobile -->
      <h2 class="detail-title mobile-title">
        {{ getItemName(item) }}
        <button 
          @click="handleToggleFavorite"
          class="favorite-btn-detail"
          :class="{ active: isFavorited }"
        >
          {{ isFavorited ? '★' : '☆' }}
        </button>
        <span v-if="item.isCustom" class="custom-badge">
          <span class="badge-icon">✏️</span>
          <span class="badge-text">CUSTOM ENTRY</span>
        </span>
      </h2>

      <div id="detail-info">
        <!-- Desktop title - hidden on mobile -->
        <h2 class="detail-title desktop-title">
          {{ getItemName(item) }}
          <button 
            @click="handleToggleFavorite"
            class="favorite-btn-detail"
            :class="{ active: isFavorited }"
          >
            {{ isFavorited ? '★' : '☆' }}
          </button>
          <span v-if="item.isCustom" class="custom-badge">
          <span class="badge-icon">✏️</span>
          <span class="badge-text">CUSTOM ENTRY</span>
        </span>
        </h2>
        
        <div class="detail-field" v-if="item.description">
          <label>Description</label>
          <div class="value">{{ item.description }}</div>
        </div>
        
        <div class="detail-field" v-if="item.hometown">
          <label>Hometown</label>
          <div class="value">{{ item.hometown }}</div>
        </div>
        
        <div class="detail-field" v-if="item.location_string">
          <label>Location</label>
          <div class="value">{{ item.location_string }}</div>
        </div>
        
        <div class="detail-field" v-if="item.location?.dimensions">
          <label>Camp Size</label>
          <div class="value">{{ item.location.dimensions }}</div>
        </div>
        
        <div class="detail-field" v-if="item.landmark">
          <label>Landmark</label>
          <div class="value">{{ item.landmark }}</div>
        </div>
        
        <div class="detail-field" v-if="item.url">
          <label>Website</label>
          <div class="value">
            <a :href="item.url" target="_blank" rel="noopener">{{ item.url }}</a>
          </div>
        </div>
        
        <div class="detail-field" v-if="item.contact_email">
          <label>Contact</label>
          <div class="value">
            <a :href="'mailto:' + item.contact_email">{{ item.contact_email }}</a>
          </div>
        </div>
        
        <div class="detail-field" v-if="props.type === 'camp' && campEvents.length > 0">
          <label>Camp Events</label>
          <div class="value">
            <ul class="camp-events">
              <li v-for="event in campEvents" :key="event.uid" class="event-item">
                <strong>
                  <router-link 
                    :to="`/${props.year}/events/${event.uid}`" 
                    class="event-title-link"
                    @click.stop
                  >
                    {{ event.title }}
                  </router-link>
                </strong>
                <span v-if="event.event_type" class="event-type">{{ event.event_type.label }}</span>
                <div v-if="event.description" class="event-description">{{ event.description }}</div>
                <div v-if="event.occurrence_set && event.occurrence_set.length > 0" class="event-times">
                  <div v-for="(occ, idx) in event.occurrence_set" :key="idx" class="occurrence-item">
                    <small>{{ formatEventTime(occ) }}</small>
                    <button 
                      @click.stop="handleScheduleEvent(event, occ)"
                      :class="['schedule-btn', { scheduled: scheduledOccurrences.get(`${event.uid}_${occ.start_time}`) }]"
                      :title="scheduledOccurrences.get(`${event.uid}_${occ.start_time}`) ? 'Remove from schedule' : 'Add to schedule'"
                    >
                      {{ scheduledOccurrences.get(`${event.uid}_${occ.start_time}`) ? '📅' : '➕' }}
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- For standalone event pages -->
        <div class="detail-field" v-if="props.type === 'event' && item.occurrence_set && item.occurrence_set.length > 0">
          <label>Event Times</label>
          <div class="value">
            <div class="event-times">
              <div v-for="(occ, idx) in item.occurrence_set" :key="idx" class="occurrence-item">
                <small>{{ formatEventTime(occ) }}</small>
                <button 
                  @click.stop="handleScheduleEvent(item, occ)"
                  :class="['schedule-btn', { scheduled: scheduledOccurrences.get(`${item.uid}_${occ.start_time}`) }]"
                  :title="scheduledOccurrences.get(`${item.uid}_${occ.start_time}`) ? 'Remove from schedule' : 'Add to schedule'"
                >
                  {{ scheduledOccurrences.get(`${item.uid}_${occ.start_time}`) ? '📅' : '➕' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-field" v-if="props.type === 'event' && item.enriched_location">
          <label>Location</label>
          <div class="value">{{ item.enriched_location }}</div>
        </div>
        
        <div class="detail-field" v-if="props.type === 'event' && item.camp_name">
          <label>Hosted By</label>
          <div class="value">
            <router-link 
              v-if="item.hosted_by_camp"
              :to="`/${props.year}/camps/${item.hosted_by_camp}`"
              class="camp-link"
            >
              {{ item.camp_name }}
            </router-link>
            <span v-else>{{ item.camp_name }}</span>
          </div>
        </div>
        
        <div class="detail-field" v-if="props.type === 'event' && item.event_type">
          <label>Event Type</label>
          <div class="value">{{ item.event_type.label }}</div>
        </div>

        <div class="visit-tracking">
          <h3>Visit Tracking</h3>
          <div class="visit-info" v-if="visitInfo">
            <p>✓ Visited {{ visitInfo.count }} time{{ visitInfo.count > 1 ? 's' : '' }}</p>
            <p>First visit: {{ formatVisitDate(visitInfo.firstVisit) }}</p>
            <p>Last visit: {{ formatVisitDate(visitInfo.lastVisit) }}</p>
          </div>
          <button 
            @click="markAsVisited" 
            :class="['visit-button', { visited: visitInfo }]"
          >
            {{ visitInfo ? '✓ Visited' : '📍 Mark as Visited' }}
          </button>
          
          <div class="notes-section">
            <h4>Notes</h4>
            <textarea 
              v-model="notes"
              @blur="saveNotes"
              placeholder="Add your notes about this place..."
              class="notes-textarea"
            ></textarea>
          </div>
        </div>

        <button id="back-to-list" @click="goBack">← Back to List</button>

      </div>
      
      <div id="detail-map-container">
        <div id="detail-map" ref="mapContainer"></div>
        <router-link 
          :to="`/${props.year}/map?focus=${props.type}_${props.id}`" 
          class="open-in-map-link"
        >
          Open in map →
        </router-link>
      </div>
    </div>
    <div v-else-if="loading">Loading...</div>
    <div v-else-if="error">{{ error }}</div>
    <SyncDialog 
      :show="showSyncDialog"
      :title="`Syncing ${props.type}s`"
      :message="`Getting ${props.year} data ready for offline use...`"
      :status="syncStatus"
    />
  </section>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { BRC_CENTER } from '../config'
import { getItemName, getItemLocation } from '../utils'
import { getFromCache } from '../services/storage'
import { getCampEvents } from '../services/events'
import { isFavorite, toggleFavorite } from '../services/favorites'
import { brcAddressToLatLon } from '../utils/geocoding'
import { 
  setGISYear, 
  initializeGISData, 
  getStreetLines, 
  gisStyles 
} from '../services/gisData'
import { recordVisit, getVisitInfo, saveItemNotes, getItemNotes } from '../services/visits'
import { addEventToSchedule, removeEventFromSchedule, isEventScheduled } from '../services/schedule'
import { useAutoSync } from '../composables/useAutoSync'
import SyncDialog from '../components/SyncDialog.vue'

const props = defineProps(['type', 'year', 'id'])
const router = useRouter()
const { showSyncDialog, checkAndAutoSync } = useAutoSync()

const mapContainer = ref(null)
const item = ref(null)
const loading = ref(true)
const error = ref(null)
const campEvents = ref([])
const isFavorited = ref(false)
const visitInfo = ref(null)
const notes = ref('')
const scheduledOccurrences = ref(new Map()) // Track which occurrences are scheduled
const syncStatus = ref('Checking for data...')
let detailMap = null
let detailMarker = null
let streetLayer = null
let streetLabels = []

const goBack = () => {
  router.push(`/${props.year}/${props.type}s`)
}

// Event navigation now handled by router-link

const handleToggleFavorite = () => {
  const wasAdded = toggleFavorite(props.type, props.id)
  isFavorited.value = wasAdded
}

const markAsVisited = () => {
  visitInfo.value = recordVisit(props.type, props.id, props.year)
}

const saveNotes = () => {
  saveItemNotes(props.type, props.id, props.year, notes.value)
}

const formatVisitDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  
  // Format as date for older visits
  return date.toLocaleDateString()
}

// Schedule management for events
const handleScheduleEvent = (event, occurrence) => {
  const key = `${event.uid}_${occurrence.start_time}`
  const isScheduled = scheduledOccurrences.value.get(key)
  
  if (isScheduled) {
    // Remove from schedule
    const removed = removeEventFromSchedule(event.uid, occurrence.start_time)
    if (removed) {
      scheduledOccurrences.value.set(key, false)
      // Force reactivity
      scheduledOccurrences.value = new Map(scheduledOccurrences.value)
    }
  } else {
    // Add to schedule
    const added = addEventToSchedule(event, occurrence)
    if (added) {
      scheduledOccurrences.value.set(key, true)
      // Force reactivity
      scheduledOccurrences.value = new Map(scheduledOccurrences.value)
    } else {
      alert('This event is already in your schedule!')
    }
  }
}

const checkEventScheduled = (event, occurrence) => {
  return isEventScheduled(event.uid, occurrence.start_time)
}

const loadItem = async () => {
  loading.value = true
  error.value = null
  
  try {
    // First, try to load from cache
    const cachedItems = await getFromCache(props.type, props.year)
    
    if (cachedItems && cachedItems.length > 0) {
      console.log(`Using cached data for ${props.type} detail`)
      const cachedItem = cachedItems.find(i => i.uid === props.id)
      
      if (cachedItem) {
        item.value = cachedItem
        isFavorited.value = isFavorite(props.type, props.id)
        visitInfo.value = getVisitInfo(props.type, props.id, props.year)
        notes.value = getItemNotes(props.type, props.id, props.year)
        
        // Check scheduled occurrences for events
        if (props.type === 'event' && cachedItem.occurrence_set) {
          cachedItem.occurrence_set.forEach(occurrence => {
            const key = `${cachedItem.uid}_${occurrence.start_time}`
            const isScheduled = checkEventScheduled(cachedItem, occurrence)
            scheduledOccurrences.value.set(key, isScheduled)
          })
        }
        
        loading.value = false
        return
      }
    }
    
    // No cache or item not found in cache - trigger auto-sync
    console.log(`No cached data for ${props.type}, triggering auto-sync`)
    syncStatus.value = `Downloading ${props.type} data...`
    await checkAndAutoSync(props.type, props.year)
  } catch (err) {
    error.value = `Error loading item: ${err.message}`
    console.error(err)
    loading.value = false
  }
}


const initMap = async () => {
  if (!mapContainer.value || !item.value) return
  
  if (!detailMap) {
    detailMap = L.map(mapContainer.value, {
      center: BRC_CENTER,
      zoom: 17, // Perfect zoom level for camp detail
      zoomControl: true, // Keep zoom controls enabled
      dragging: false, // Disable dragging
      touchZoom: false, // Disable touch zoom
      scrollWheelZoom: false, // Disable scroll zoom
      doubleClickZoom: false, // Disable double-click zoom
      boxZoom: false, // Disable box zoom
      keyboard: false, // Disable keyboard navigation
      tap: false // Disable tap interactions
    })
    
    // Log zoom changes
    detailMap.on('zoomend', () => {
      console.log('Current zoom level:', detailMap.getZoom())
    })
    
    // No basemap - we'll use a solid background color instead
  }
  
  // Clear existing marker
  if (detailMarker) {
    detailMap.removeLayer(detailMarker)
  }
  
  // Try to get location
  const locationString = getItemLocation(item.value)
  let coords = null
  
  if (locationString && locationString !== 'Unknown location') {
    // Set the correct year for GIS data and initialize it
    setGISYear(parseInt(props.year))
    
    // Initialize GIS data to enable intersection finding
    try {
      await initializeGISData()
      console.log('GIS data initialized for year:', props.year)
      
      // Add street layer to show correct year's streets
      if (streetLayer) {
        detailMap.removeLayer(streetLayer)
      }
      
      // Remove existing street labels
      streetLabels.forEach(label => detailMap.removeLayer(label))
      streetLabels = []
      
      const streetData = getStreetLines()
      if (streetData) {
        streetLayer = L.geoJSON(streetData, {
          style: (feature) => {
            // Custom red styling for all streets
            return {
              color: '#FF0000',  // Red color
              weight: 4,         // Thicker lines
              opacity: 1
            }
          },
          onEachFeature: (feature, layer) => {
            // Add street name labels
            if (feature.properties && feature.properties.name) {
              const streetName = feature.properties.name
              const center = layer.getBounds().getCenter()
              
              // Create a divIcon for the label
              const label = L.divIcon({
                className: 'street-label',
                html: `<div>${streetName}</div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
              })
              
              // Add label marker at the center of the street segment
              const labelMarker = L.marker(center, { icon: label }).addTo(detailMap)
              streetLabels.push(labelMarker)
            }
          }
        }).addTo(detailMap)
        console.log('Added street layer for year:', props.year)
      }
    } catch (err) {
      console.warn('Failed to initialize GIS data:', err)
    }
    
    coords = brcAddressToLatLon(locationString)
  }
  
  if (coords) {
    // Show actual location
    console.log('Setting view to coords:', coords, 'with zoom 17')
    detailMap.setView(coords, 17)
    detailMarker = L.marker(coords).addTo(detailMap)
    detailMarker.bindPopup(`
      <strong>${getItemName(item.value)}</strong><br>
      <em>${locationString}</em>
    `).openPopup()
  } else {
    // Show center with note if no location
    console.log('No coords, setting view to BRC_CENTER with zoom 17')
    detailMap.setView(BRC_CENTER, 17)
    detailMarker = L.marker(BRC_CENTER).addTo(detailMap)
    detailMarker.bindPopup('Black Rock City Center<br><em>Camp location not available</em>').openPopup()
  }
  
  setTimeout(() => detailMap.invalidateSize(), 100)
}

// Format event time
const formatEventTime = (occurrence) => {
  if (!occurrence || !occurrence.start_time) return 'Time TBD'
  
  // Parse the ISO date string
  const start = new Date(occurrence.start_time)
  const end = occurrence.end_time ? new Date(occurrence.end_time) : null
  
  // Format day and time
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const day = days[start.getDay()]
  const startTime = start.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  
  if (end) {
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    return `${day} ${startTime} - ${endTime}`
  }
  
  return `${day} ${startTime}`
}

// Load camp events
const loadCampEvents = async () => {
  if (props.type !== 'camp' || !item.value) return
  
  try {
    // Use the events service to get filtered events
    const events = await getCampEvents(item.value.uid, props.year)
    campEvents.value = events
    
    // Check which occurrences are scheduled
    events.forEach(event => {
      if (event.occurrence_set) {
        event.occurrence_set.forEach(occurrence => {
          const key = `${event.uid}_${occurrence.start_time}`
          const isScheduled = checkEventScheduled(event, occurrence)
          scheduledOccurrences.value.set(key, isScheduled)
        })
      }
    })
    
    if (events.length > 0) {
      console.log(`Found ${events.length} events for camp ${item.value.name}`)
    }
  } catch (err) {
    console.error('Error loading camp events:', err)
  }
}

onMounted(async () => {
  await loadItem()
  if (item.value) {
    setTimeout(() => initMap(), 100)
    // Load events if it's a camp
    if (props.type === 'camp') {
      loadCampEvents()
    }
  }
})

watch(() => props.id, async () => {
  await loadItem()
  if (item.value) {
    setTimeout(() => initMap(), 100)
  }
})
</script>

<style scoped>
#detail-section {
  background: #1a1a1a;
  color: #fff;
}

h2 {
  color: #fff;
}

.detail-field label {
  color: #ccc;
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-field .value {
  color: #fff;
}

.detail-field a {
  color: #ff6666;
}

.detail-field a:hover {
  color: #ff9999;
}

.event {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #fff;
}

.event-type {
  color: #ccc;
  font-style: normal !important; /* Remove italics */
  font-weight: bold;
  margin-left: 0;
  text-transform: uppercase;
}

/* Event title link styling */
.event-title-link {
  color: #fff;
  text-decoration: none;
  transition: color 0.2s ease;
}

.event-title-link:hover {
  color: #ff6666;
  text-decoration: underline;
}

/* Open in map link styling */
.open-in-map-link {
  display: block;
  text-align: right;
  margin-top: 8px;
  color: #8B0000;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.open-in-map-link:hover {
  color: #FF4444;
  text-decoration: underline;
}

/* Override global camp-events li styles with higher specificity */
.camp-events .event-item {
  cursor: pointer;
  padding: 16px; /* 2x 8px rhythm */
  margin: 0 !important; /* Override global margin */
  margin-bottom: 0 !important; /* Remove gap between items */
  border: none !important; /* Remove all borders first */
  border-left: 1px solid #444 !important;
  border-right: 1px solid #444 !important;
  border-radius: 0 !important; /* Remove radius from all items */
  background: #1a1a1a;
  transition: background-color 0.2s;
}

/* Alternate background colors */
.camp-events .event-item:nth-child(even) {
  background: rgb(54, 10, 10); /* color(srgb 0.21 0.0388 0.0388) converted to RGB */
}

/* First item gets top border and radius */
.camp-events .event-item:first-child {
  border-top: 1px solid #444 !important;
  border-top-left-radius: 8px !important;
  border-top-right-radius: 8px !important;
}

/* Last item gets bottom border and radius */
.camp-events .event-item:last-child {
  border-bottom: 1px solid #444 !important;
  border-bottom-left-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
  margin-bottom: 0 !important;
}

/* Add separator between items */
.camp-events .event-item:not(:last-child) {
  border-bottom: 1px solid #333;
}

.camp-events .event-item:hover {
  background-color: #8B0000;
}

.camp-events {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Also override any li elements that might not have event-item class */
.camp-events li {
  margin-bottom: 0 !important;
  border-radius: 0 !important;
}

h2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Hide mobile title on desktop */
.mobile-title {
  display: none;
}

/* Show desktop title */
.desktop-title {
  display: flex;
}

@media (max-width: 768px) {
  /* Show mobile title */
  .mobile-title {
    display: flex;
    order: -2; /* Ensure it's before the map */
    margin: 0;
    font-size: 1.5rem;
  }
  
  /* Hide desktop title */
  .desktop-title {
    display: none;
  }
}

.favorite-btn-detail {
  background: none;
  border: none;
  font-size: 3rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  color: #666;
  transition: color 0.2s;
}

.favorite-btn-detail:hover {
  color: #FFD700;
}

.favorite-btn-detail.active {
  color: #FFD700;
}

.custom-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem;
  padding: 0.375rem 0.875rem;
  background: #8B0000;
  color: #fff;
  font-weight: 600;
  border-radius: 20px;
  vertical-align: middle;
  line-height: 1;
}

.badge-icon {
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-right: 0.375rem;
}

.badge-text {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  line-height: 1;
  display: flex;
  align-items: center;
}

.visit-tracking {
  margin-top: 2rem;
  padding: 16px; /* 2x 8px rhythm */
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #333;
}

.visit-tracking h3 {
  color: #ccc;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.visit-info {
  background: #2a2a2a;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.visit-info p {
  margin: 0.5rem 0;
  color: #ccc;
}

.visit-button {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.visit-button:hover {
  background: #8B0000;
  color: #fff;
}

.visit-button.visited {
  background: #228B22;
  color: #fff;
}

.notes-section {
  margin-top: 2rem;
}

.notes-section h4 {
  color: #ccc;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.notes-textarea {
  width: 100%;
  min-height: 100px;
  max-width: 100%;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.notes-textarea:focus {
  outline: none;
  border-color: #8B0000;
}

.notes-textarea::placeholder {
  color: #666;
}

.event-times {
  margin-top: 0;
  padding-top: 0;
  border-top: none; /* Remove top border */
}

.occurrence-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
}

/* Make date/time in occurrence items more prominent */
.occurrence-item small {
  font-size: 1rem !important; /* Same size as description */
  font-weight: normal !important; /* Same weight as description */
  color: #fff !important; /* Make it stand out */
}

.schedule-btn {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.schedule-btn:hover {
  background: #8B0000;
  border-color: #8B0000;
}

.schedule-btn.scheduled {
  background: #228B22;
  border-color: #228B22;
}

.schedule-btn.scheduled:hover {
  background: #8B0000;
  border-color: #8B0000;
}

.camp-link {
  color: #90CAF9;
  text-decoration: none;
  transition: color 0.2s;
}

.camp-link:hover {
  color: #64B5F6;
  text-decoration: underline;
}

/* Custom map styling */
#detail-map-container {
  background-color: #000000;
}

#detail-map {
  background-color: #000000;
}

/* Style the Leaflet container background */
:deep(.leaflet-container) {
  background-color: #000000;
}

/* Hide attribution since we're not using basemap */
:deep(.leaflet-control-attribution) {
  display: none;
}

/* Street label styling */
:deep(.street-label) {
  background: none;
  border: none;
  color: #FFFFFF;
  font-weight: bold;
  font-size: 12px;
  text-shadow: 1px 1px 2px #000000, -1px -1px 2px #000000;
  white-space: nowrap;
  pointer-events: none;
  text-align: center;
}

:deep(.street-label div) {
  text-align: center;
  width: 100%;
}
</style>