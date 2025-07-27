<template>
  <section id="detail-section" class="view">
    <div id="detail-content" v-if="item">

      <div id="detail-info">

        <h2>
          {{ getItemName(item) }}
          <button 
            @click="handleToggleFavorite"
            class="favorite-btn-detail"
            :class="{ active: isFavorited }"
          >
            {{ isFavorited ? '★' : '☆' }}
          </button>
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
              <li v-for="event in campEvents" :key="event.uid" @click="logEventData(event)" class="event-item">
                <strong>{{ event.title }}</strong>
                <span v-if="event.event_type" class="event-type">({{ event.event_type.label }})</span>
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

const goBack = () => {
  router.push(`/${props.year}/${props.type}s`)
}

const logEventData = (event) => {
  console.log('Event clicked:', event)
  console.log('Event details:')
  console.log('- Title:', event.title)
  console.log('- UID:', event.uid)
  console.log('- Event ID:', event.event_id)
  console.log('- Type:', event.event_type?.label)
  console.log('- Description:', event.description)
  console.log('- Hosted by camp:', event.hosted_by_camp)
  console.log('- Occurrences:', event.occurrence_set?.length || 0)
  if (event.occurrence_set) {
    event.occurrence_set.forEach((occ, idx) => {
      console.log(`  - Occurrence ${idx + 1}: ${occ.start_time} to ${occ.end_time}`)
    })
  }
  console.log('- Full event object:', JSON.stringify(event, null, 2))
}

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


const initMap = () => {
  if (!mapContainer.value || !item.value) return
  
  if (!detailMap) {
    detailMap = L.map(mapContainer.value, {
      center: BRC_CENTER,
      zoom: 14,
      zoomControl: true
    })
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(detailMap)
  }
  
  // Clear existing marker
  if (detailMarker) {
    detailMap.removeLayer(detailMarker)
  }
  
  // Try to get location
  const locationString = getItemLocation(item.value)
  let coords = null
  
  if (locationString && locationString !== 'Unknown location') {
    coords = brcAddressToLatLon(locationString)
  }
  
  if (coords) {
    // Show actual location
    detailMap.setView(coords, 15)
    detailMarker = L.marker(coords).addTo(detailMap)
    detailMarker.bindPopup(`
      <strong>${getItemName(item.value)}</strong><br>
      <em>${locationString}</em>
    `).openPopup()
  } else {
    // Show center with note if no location
    detailMap.setView(BRC_CENTER, 13)
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
    setTimeout(initMap, 100)
    // Load events if it's a camp
    if (props.type === 'camp') {
      loadCampEvents()
    }
  }
})

watch(() => props.id, async () => {
  await loadItem()
  if (item.value) {
    setTimeout(initMap, 100)
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
  color: #8B0000;
  font-weight: 600;
  font-size: 0.75rem;
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
}

.event-item {
  cursor: pointer;
  padding: 0;
  margin: 0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.event-item:hover {
  background-color: #8B0000;
}

.camp-events {
  list-style: none;
  padding: 0;
  margin: 0;
}

h2 {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.favorite-btn-detail {
  background: none;
  border: none;
  font-size: 1.5rem;
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

.visit-tracking {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #333;
}

.visit-tracking h3 {
  color: #8B0000;
  margin-bottom: 1rem;
  font-size: 0.875rem;
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
  color: #8B0000;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
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
  margin-top: 0.5rem;
}

.occurrence-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
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
</style>