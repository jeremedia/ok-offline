<template>
  <section id="detail-section" class="view">
    <div id="detail-content" v-if="item">
      <!-- Header - full width on desktop, follows mobile order -->
      <div class="detail-header">
        <h2 class="detail-title">
          <div class="title-left">
            <span class="item-type-icon">{{ props.type === 'camp' ? '🏕️' : props.type === 'art' ? '🎨' : '🎪' }}</span>
            <span class="title-text">{{ getItemName(item) }}</span>
          </div>
          <div class="title-right">
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
          </div>
        </h2>
      </div>

      <!-- Desktop two-column layout wrapper -->
      <div class="detail-columns">
        <!-- Column 1: Item details -->
        <div id="detail-info">
        
        <div class="detail-field" v-if="item.description">
          <label>Description</label>
          <div class="value">{{ item.description }}</div>
        </div>
        
        <!-- Camp: Hometown, Location, Camp Size on one line -->
        <div class="detail-fields-row" v-if="props.type === 'camp' && (item.hometown || item.location_string || item.location?.dimensions)">
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
        </div>
        
        <!-- Art: Hometown and Location on one line -->
        <div class="detail-fields-row" v-if="props.type === 'art' && (item.hometown || item.location_string)">
          <div class="detail-field" v-if="item.hometown">
            <label>Hometown</label>
            <div class="value">{{ item.hometown }}</div>
          </div>
          
          <div class="detail-field" v-if="item.location_string">
            <label>Location</label>
            <div class="value">{{ item.location_string }}</div>
          </div>
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
        
        <!-- Collapsible Camp Events Section -->
        <div class="detail-field" v-if="props.type === 'camp'">
          <div class="camp-events-section">
            <div class="events-header" @click="toggleCampEvents">
              <span class="expand-icon">{{ campEventsExpanded ? '▼' : '▶' }}</span>
              <span class="events-title">CAMP EVENTS{{ campEventsLoaded ? ` (${campEvents.length})` : '' }}</span>
            </div>
            
            <div class="events-content" v-if="campEventsExpanded">
              <div v-if="!campEventsLoaded" class="loading-events">
                Loading events...
              </div>
              <div v-else-if="campEvents.length === 0" class="no-events">
                No events scheduled for this camp.
              </div>
              <ul v-else class="camp-events">
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
        
        <!-- Event: Event Type and Location on one line -->
        <div class="detail-fields-row" v-if="props.type === 'event' && (item.event_type || item.enriched_location)">
          <div class="detail-field" v-if="item.event_type">
            <label>Event Type</label>
            <div class="value">{{ item.event_type.label }}</div>
          </div>
          
          <div class="detail-field" v-if="item.enriched_location">
            <label>Location</label>
            <div class="value">{{ item.enriched_location }}</div>
          </div>
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
        
        <!-- Column 2: Map -->
        <div id="detail-map-container">
          <div id="detail-map" ref="mapContainer"></div>
          <div class="map-controls">
            <div class="zoom-controls">
              <button @click="handleZoomOut" class="zoom-btn" :disabled="currentZoom <= 10">−</button>
              <span class="zoom-level">{{ currentZoom }}</span>
              <button @click="handleZoomIn" class="zoom-btn" :disabled="currentZoom >= 18">+</button>
            </div>
            <router-link 
              :to="`/${props.year}/map?focus=${props.type}_${props.id}`" 
              class="open-in-map-link"
            >
              Open in map →
            </router-link>
          </div>
        </div>
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
import 'leaflet-rotate'
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
import { canShowLocations } from '../stores/globalState'

const props = defineProps(['type', 'year', 'id'])
const router = useRouter()
const { showSyncDialog, checkAndAutoSync } = useAutoSync()

const mapContainer = ref(null)
const item = ref(null)
const loading = ref(true)

// Helper function to get CSS variable values for JavaScript
const getCSSColor = (varName) => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}
const error = ref(null)
const campEvents = ref([])
const campEventsLoaded = ref(false)
const campEventsExpanded = ref(false)
const isFavorited = ref(false)
const visitInfo = ref(null)
const notes = ref('')
const currentZoom = ref(15) // Default zoom level
const scheduledOccurrences = ref(new Map()) // Track which occurrences are scheduled
const syncStatus = ref('Checking for data...')
let detailMap = null
let detailMarker = null
let streetLayer = null
let streetLabels = []
let streetGeoJsonData = null // Store the GeoJSON data for re-rendering labels

const goBack = () => {
  router.push(`/${props.year}/${props.type}s`)
}

// Store the marker position for zoom centering
let markerPosition = null

// Zoom control handlers
const handleZoomIn = () => {
  if (detailMap && currentZoom.value < 18 && markerPosition) {
    detailMap.setView(markerPosition, currentZoom.value + 1)
  }
}

const handleZoomOut = () => {
  if (detailMap && currentZoom.value > 10 && markerPosition) {
    detailMap.setView(markerPosition, currentZoom.value - 1)
  }
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
        
        // Initialize camp events expanded state from localStorage
        if (props.type === 'camp') {
          const storageKey = `campEventsExpanded_${props.id}`
          const savedState = localStorage.getItem(storageKey)
          campEventsExpanded.value = savedState === 'true'
        }
        
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
  
  // Get saved zoom level for this specific item
  const savedZoomKey = `detailZoom_${props.type}_${props.id}`
  const savedZoom = localStorage.getItem(savedZoomKey)
  const initialZoom = savedZoom ? parseInt(savedZoom) : 15 // Default to 15 if not saved
  
  // Update currentZoom to match saved/initial zoom
  currentZoom.value = initialZoom
  
  if (!detailMap) {
    detailMap = L.map(mapContainer.value, {
      center: BRC_CENTER,
      zoom: initialZoom,
      zoomControl: false, // Disable default zoom controls
      dragging: false, // Disable dragging
      touchZoom: false, // Disable touch zoom
      scrollWheelZoom: false, // Disable scroll zoom
      doubleClickZoom: false, // Disable double-click zoom
      boxZoom: false, // Disable box zoom
      keyboard: false, // Disable keyboard navigation
      tap: false // Disable tap interactions
    })
    
    // Track zoom changes and update street labels
    detailMap.on('zoomend', () => {
      currentZoom.value = detailMap.getZoom()
      console.log('Current zoom level:', currentZoom.value)
      
      // Save zoom level for this specific item
      const zoomKey = `detailZoom_${props.type}_${props.id}`
      localStorage.setItem(zoomKey, currentZoom.value.toString())
      
      // Update street labels based on zoom level
      updateStreetLabels()
    })
    
    // No basemap - we'll use a solid background color instead
  }
  
  // Clear existing marker
  if (detailMarker) {
    detailMap.removeLayer(detailMarker)
  }
  
  // Always set the correct year for GIS data and initialize it
  // This ensures streets are shown even when camp locations aren't available (e.g., 2025)
  setGISYear(parseInt(props.year))
  
  // Initialize GIS data to show streets
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
    console.log('Street data loaded:', streetData ? 'Yes' : 'No', streetData)
    if (streetData) {
      streetGeoJsonData = streetData // Store for re-rendering labels
      streetLayer = L.geoJSON(streetData, {
        style: (feature) => {
          // Custom red styling for all streets
          return {
            color: getCSSColor('--color-danger'),  // Red color
            weight: 2,         // Thinner lines for detail view
            opacity: 0.8
          }
        },
        onEachFeature: (feature, layer) => {
          // Street labels will be added by updateStreetLabels() based on zoom level
        }
      }).addTo(detailMap)
      console.log('Added street layer for year:', props.year)
      
      // Add street labels based on current zoom level
      updateStreetLabels()
    } else {
      console.warn('No street data available for year:', props.year)
      // Add a simple circle to show the general area if no streets are available
      const circle = L.circle(BRC_CENTER, {
        color: getCSSColor('--color-danger'),
        fillColor: getCSSColor('--color-danger'),
        fillOpacity: 0.1,
        radius: 2000, // 2000 meter radius for BRC
        weight: 1
      }).addTo(detailMap)
    }
  } catch (err) {
    console.warn('Failed to initialize GIS data:', err)
    // Add a simple circle to show the general area if GIS fails
    const circle = L.circle(BRC_CENTER, {
      color: getCSSColor('--color-danger'),
      fillColor: getCSSColor('--color-danger'),
      fillOpacity: 0.1,
      radius: 2000, // 2000 meter radius for BRC
      weight: 1
    }).addTo(detailMap)
  }
  
  // Check if we can show locations for this year
  const canShow = canShowLocations(props.year)
  
  // Try to get location
  const locationString = getItemLocation(item.value)
  let coords = null
  
  
  // Only try to geocode if we're allowed to show locations
  if (canShow && locationString && locationString !== 'Unknown location') {
    coords = brcAddressToLatLon(locationString)
  }
  
  // Create custom marker icon that works offline
  const markerIcon = L.divIcon({
    className: 'detail-marker',
    html: '<div class="marker-icon">📍</div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30], // Bottom center of the pin
    popupAnchor: [0, -30] // Above the pin
  })
  
  if (coords) {
    // Show actual location
    markerPosition = coords // Store for zoom centering
    console.log('Setting view to coords:', coords, 'with zoom', detailMap.getZoom())
    detailMap.setView(coords, detailMap.getZoom())
    detailMarker = L.marker(coords, { icon: markerIcon }).addTo(detailMap)
    detailMarker.bindPopup(`
      <strong>${getItemName(item.value)}</strong><br>
      <em>${locationString}</em>
    `).openPopup()
  } else {
    // Show at Golden Spike (center) with note about location
    // Use zoom 14 for items without location
    markerPosition = BRC_CENTER // Store for zoom centering
    const noLocationZoom = 14
    console.log('No coords, setting view to BRC_CENTER with zoom', noLocationZoom)
    detailMap.setView(BRC_CENTER, noLocationZoom)
    detailMarker = L.marker(BRC_CENTER, { icon: markerIcon }).addTo(detailMap)
    
    // Determine the item type for the message
    const itemType = props.type.charAt(0).toUpperCase() + props.type.slice(1)
    
    // Different message based on whether locations are hidden by policy or just not available
    const locationMessage = !canShow 
      ? `${itemType} location not yet released`
      : `${itemType} location not available`
    
    detailMarker.bindPopup(`
      <strong>${getItemName(item.value)}</strong><br>
      <em>${locationMessage}</em>
    `).openPopup()
  }
  
  // Prevent map from intercepting scroll events - allow smooth page scrolling
  const mapElement = mapContainer.value
  if (mapElement) {
    // Use CSS to prevent scroll events from reaching the map
    mapElement.style.touchAction = 'pan-y pinch-zoom'
    mapElement.style.overscrollBehavior = 'contain'
    
    // Add event listener that stops scroll events from reaching Leaflet
    const preventMapScroll = (e) => {
      e.stopImmediatePropagation()
      e.preventDefault()
      return false
    }
    
    mapElement.addEventListener('wheel', preventMapScroll, { capture: true, passive: false })
    mapElement.addEventListener('mousewheel', preventMapScroll, { capture: true, passive: false })
    mapElement.addEventListener('DOMMouseScroll', preventMapScroll, { capture: true, passive: false })
    
    console.log('Map scroll interception disabled - page scrolling enabled')
  }
  
  // Apply -45 degree rotation for better city orientation (gate at bottom, temple at top)
  if (detailMap && detailMap.setBearing) {
    detailMap.setBearing(-45)
    console.log('Applied -45 degree rotation to detail map')
  }
  
  setTimeout(() => detailMap.invalidateSize(), 100)
}

// Update street labels based on zoom level
const updateStreetLabels = () => {
  if (!detailMap || !streetGeoJsonData) return
  
  // Remove existing street labels
  streetLabels.forEach(label => detailMap.removeLayer(label))
  streetLabels = []
  
  const zoom = detailMap.getZoom()
  
  // Don't show any labels at zoom 14 and below
  if (zoom <= 14) {
    return
  }
  
  // Re-add labels with appropriate text based on zoom
  streetGeoJsonData.features.forEach(feature => {
    if (feature.properties && feature.properties.name) {
      let streetName = feature.properties.name
      const originalName = streetName
      
      // Format avenue names to be shorter (e.g., "3:00" -> "3")
      streetName = streetName.replace(/(\d+):00/g, '$1')
      
      // At zoom 15 and smaller, show only first letter
      if (zoom <= 15) {
        streetName = streetName.charAt(0)
      }
      
      // Get the center of the street segment
      const coords = feature.geometry.coordinates
      let lat, lon
      
      if (feature.geometry.type === 'LineString' && coords.length > 0) {
        // Get the middle point of the line
        const midIndex = Math.floor(coords.length / 2)
        lon = coords[midIndex][0]
        lat = coords[midIndex][1]
      } else if (feature.geometry.type === 'MultiLineString' && coords.length > 0 && coords[0].length > 0) {
        // For MultiLineString, use the first line's middle point
        const midIndex = Math.floor(coords[0].length / 2)
        lon = coords[0][midIndex][0]
        lat = coords[0][midIndex][1]
      } else {
        return // Skip if we can't get coordinates
      }
      
      // Create a divIcon for the label
      const label = L.divIcon({
        className: 'street-label',
        html: `<div>${streetName}</div>`,
        iconSize: [100, 20],
        iconAnchor: [50, 10]
      })
      
      // Add label marker at the center of the street segment
      const labelMarker = L.marker([lat, lon], { icon: label }).addTo(detailMap)
      streetLabels.push(labelMarker)
    }
  })
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

// Toggle camp events section
const toggleCampEvents = async () => {
  const storageKey = `campEventsExpanded_${props.id}`
  campEventsExpanded.value = !campEventsExpanded.value
  
  // Remember state per camp
  localStorage.setItem(storageKey, campEventsExpanded.value.toString())
  
  // Only load events when expanded for the first time
  if (campEventsExpanded.value && !campEventsLoaded.value) {
    await loadCampEvents()
  }
}

// Load camp events (lazy loading)
const loadCampEvents = async () => {
  if (props.type !== 'camp' || !item.value || campEventsLoaded.value) return
  
  try {
    // Use the events service to get filtered events
    const events = await getCampEvents(item.value.uid, props.year)
    campEvents.value = events
    campEventsLoaded.value = true
    
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
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#detail-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  gap: 0;
  position: relative;
}

/* Header styling - full width */
.detail-header {
  padding: 0 16px;
  flex-shrink: 0;
}

.detail-title {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Mobile layout - stacked columns */
.detail-columns {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Critical for nested flex containers */
  overflow-y: auto; /* Single scroll container for mobile */
  -webkit-overflow-scrolling: touch;
}

#detail-info {
  padding: 0 16px 16px !important;
  padding-bottom: 0 !important; /* Override external padding */
  overflow: visible; /* No inner scrolling */
  flex-shrink: 0; /* Don't shrink, let parent scroll */
  box-sizing: border-box;
}

#detail-map-container {
  background-color: var(--color-bg-base) !important;
  position: relative !important;
  flex-shrink: 0;
  height: 300px; /* Fixed height on mobile */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  border: 1px solid var(--color-bg-input) !important;
  border-radius: 8px;
  padding: 0 !important; /* Override external padding */
  top: auto !important; /* Override sticky positioning */
  max-width: none !important;
  margin-bottom: 16px; /* Add spacing for scroll */
}

/* Desktop layout - side by side columns */
@media (min-width: 768px) {
  .detail-columns {
    flex-direction: row;
    gap: 0;
    overflow-y: auto; /* Single scroll container for desktop too */
  }
  
  #detail-info {
    flex: 1 1 50%; /* grow: 1, shrink: 1, basis: 50% */
    width: auto;
    padding: 24px;
    min-height: 0;
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  #detail-map-container {
    flex: 1 1 50%; /* grow: 1, shrink: 1, basis: 50% */
    width: auto !important;
    height: auto !important; /* Override fit-content */
    min-height: 0; /* Allow shrinking */
    box-sizing: border-box;
    overflow: hidden;
    align-self: stretch; /* Ensure it stretches to match sibling height */
    position: relative !important; /* Override sticky */
    top: auto !important;
    max-width: none !important;
  }
}


.detail-field label, .events-title, .visit-tracking h3, .visit-tracking h4 {
  color: var(--color-accent) !important;
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-field .value {
  color: var(--color-text-primary);
  line-height: 1.5;
}

.detail-field a {
  color: var(--color-accent);
}

.detail-field a:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

.event {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-input);
  color: var(--color-text-primary);
}

.event-type {
  color: var(--color-text-secondary);
  font-style: normal !important; /* Remove italics */
  font-weight: bold;
  margin-left: 0;
  text-transform: uppercase;
}

/* Event title link styling */
.event-title-link {
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

.event-title-link:hover {
  color: var(--color-error);
  text-decoration: underline;
}

/* Map controls container */
.map-controls {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-modal-overlay);
  flex-shrink: 0;
  border-top: 1px solid var(--color-bg-input); /* Only top border */
  border-radius: 0; /* Remove radius since container handles it */
}

/* Zoom controls container */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Zoom buttons */
.zoom-btn {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-bg-input);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.zoom-btn:hover:not(:disabled) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.zoom-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Zoom level display */
.zoom-level {
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

/* Open in map link styling */
.open-in-map-link {
  color: var(--color-accent);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: bold;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.open-in-map-link:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

/* Override global camp-events li styles with higher specificity */
.camp-events .event-item {
  cursor: pointer;
  padding: 16px; /* 2x 8px rhythm */
  margin: 0 !important; /* Override global margin */
  margin-bottom: 0 !important; /* Remove gap between items */
  border: none !important; /* Remove all borders first */
  border-left: 1px solid var(--color-bg-input) !important;
  border-right: 1px solid var(--color-bg-input) !important;
  border-radius: 0 !important; /* Remove radius from all items */
  background: var(--color-bg-base);
  transition: background-color 0.2s;
}

/* Alternate background colors */
.camp-events .event-item:nth-child(even) {
  background: var(--color-primary-darker);
}

/* First item gets top border and radius */
.camp-events .event-item:first-child {
  border-top: 1px solid var(--color-bg-input) !important;
  border-top-left-radius: 8px !important;
  border-top-right-radius: 8px !important;
}

/* Last item gets bottom border and radius */
.camp-events .event-item:last-child {
  border-bottom: 1px solid var(--color-bg-input) !important;
  border-bottom-left-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
  margin-bottom: 0 !important;
}

/* Add separator between items */
.camp-events .event-item:not(:last-child) {
  border-bottom: 1px solid var(--color-bg-header);
}

/* Hover effect removed per user request */

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

.title-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.title-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.item-type-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

/* Flexbox row for grouped detail fields */
.detail-fields-row {
  display: flex;
  gap: 16px; /* Same as current vertical gap between detail-field divs */
  flex-wrap: nowrap;
  margin-bottom: 0px;
  overflow-x: auto;
}

.detail-fields-row .detail-field {
  flex: 1;
  min-width: 150px; /* Reduced to allow 3 items on one line */
  margin-bottom: 0; /* Remove bottom margin since parent handles gap */
}

.favorite-btn-detail {
  background: none;
  border: none;
  font-size: 3rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  color: var(--color-text-disabled);
  transition: color 0.2s;
}

.favorite-btn-detail:hover {
  color: var(--color-accent);
}

.favorite-btn-detail.active {
  color: var(--color-accent);
}

.custom-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem;
  padding: 0.375rem 0.875rem;
  background: var(--color-primary);
  color: var(--color-text-primary);
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
  margin-top: 1rem;
  padding: 16px; /* 2x 8px rhythm */
  background: var(--color-bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--color-bg-header);
}

.visit-tracking h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.visit-info {
  background: var(--color-bg-elevated);
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.visit-info p {
  margin: 0.5rem 0;
  color: var(--color-text-secondary);
}

.visit-button {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-bg-input);
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.visit-button:hover {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.visit-button.visited {
  background: var(--color-success);
  color: var(--color-text-primary);
}

.notes-section {
  margin-top: 2rem;
}

.notes-section h4 {
  color: var(--color-text-secondary);
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
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-bg-input);
  border-radius: 4px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.notes-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.notes-textarea::placeholder {
  color: var(--color-text-disabled);
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
  color: var(--color-text-primary) !important; /* Make it stand out */
}

.schedule-btn {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-input);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.schedule-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.schedule-btn.scheduled {
  background: var(--color-success);
  border-color: var(--color-success);
}

.schedule-btn.scheduled:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.camp-link {
  color: var(--color-info);
  text-decoration: none;
  transition: color 0.2s;
}

.camp-link:hover {
  color: var(--color-info);
  text-decoration: underline;
}

/* Custom map styling */
#detail-map-container {
  background-color: var(--color-bg-base);
}

#detail-map {
  background-color: var(--color-bg-base);
  width: 100%;
  flex: 1;
  min-height: 0;
  border: none !important; /* Ensure no borders */
}

/* Style the Leaflet container background */
:deep(.leaflet-container) {
  background-color: var(--color-bg-base);
}

/* Hide all Leaflet controls */
:deep(.leaflet-control-attribution) {
  display: none;
}

:deep(.leaflet-control-container) {
  display: none;
}

/* Street label styling */
:deep(.street-label) {
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-weight: bold;
  font-size: 12px;
  text-shadow: 1px 1px 2px var(--color-bg-base), -1px -1px 2px var(--color-bg-base);
  white-space: nowrap;
  pointer-events: none;
  text-align: center;
}

:deep(.street-label div) {
  text-align: center;
  width: 100%;
}

/* Leaflet popup styling to match theme */
:deep(.leaflet-popup) {
  margin-bottom: 20px;
}

:deep(.leaflet-popup-content-wrapper) {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-input);
  border-radius: 4px;
  box-shadow: 0 3px 14px var(--color-modal-overlay);
  padding: 0;
}

:deep(.leaflet-popup-content) {
  margin: 0;
  padding: 16px;
  color: var(--color-text-primary);
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  min-width: 200px;
}

:deep(.leaflet-popup-content strong) {
  color: var(--color-text-primary);
  font-weight: bold;
  font-size: 1rem;
  display: block;
  margin-bottom: 4px;
}

:deep(.leaflet-popup-content em) {
  color: var(--color-text-secondary);
  font-style: normal;
  font-size: 0.85rem;
}

:deep(.leaflet-popup-tip-container) {
  display: none; /* Hide the arrow tip */
}

:deep(.leaflet-popup-close-button) {
  color: var(--color-text-secondary) !important;
  font-size: 20px !important;
  font-weight: normal !important;
  line-height: 20px !important;
  padding: 4px 4px 0 0 !important;
  text-align: center !important;
  width: 20px !important;
  height: 20px !important;
  background: none !important;
  border: none !important;
}

:deep(.leaflet-popup-close-button:hover) {
  color: var(--color-text-primary) !important;
}

/* Custom marker styling */
:deep(.detail-marker) {
  background: none;
  border: none;
}

:deep(.detail-marker .marker-icon) {
  background: var(--color-primary);
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 5px var(--color-overlay-dark);
}

/* Popup styles remain interactive */
</style>