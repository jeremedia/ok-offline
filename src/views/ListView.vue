<template>
  <PullToRefresh @refresh="handleRefresh">
  <section id="list-section" class="view">
    <SyncDialog 
      :show="showSyncDialog"
      :title="`Syncing ${props.type}s`"
      :message="`Getting ${props.year} data ready for offline use...`"
      :status="syncStatus"
    />
    <LoadingSpinner v-if="loading && !showSyncDialog" message="Loading data..." />
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-button">Try Again</button>
    </div>
    <template v-else>
    <div id="list-controls">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="Filter by name..."
        class="search-input"
      />
      <label for="sort-selector">Sort by:</label>
      <select id="sort-selector" v-model="sortBy">
        <option value="name">Name</option>
        <option value="location">Location/Sector</option>
        <option value="sector">Sector (Clock Position)</option>
        <option value="avenue">Avenue (A-L)</option>
        <option value="distance" v-if="userLocation">Distance</option>
        <option value="date" v-if="props.type === 'event'">Date/Time</option>
      </select>
      <span v-if="!loading && !error && items.length > 0" class="items-count">
        {{ sortedItems.length }} of {{ items.length }}
      </span>
      <button 
        @click="showFavoritesOnly = !showFavoritesOnly"
        :class="['favorites-toggle', { active: showFavoritesOnly }]"
      >
        ⭐ {{ showFavoritesOnly ? 'Show All' : 'Favorites' }} {{ favoriteCount > 0 ? `(${favoriteCount})` : '' }}
      </button>
      <button 
        v-if="!userLocation"
        @click="enableLocation"
        class="location-toggle"
        :disabled="locationLoading"
      >
        📍 {{ locationLoading ? 'Getting location...' : 'Enable Location' }}
      </button>
    </div>
    <!-- Sector Filters for Camps/Art -->
    <div id="sector-filters" v-if="type === 'camp' || type === 'art'">
      <div class="filter-header" @click="toggleFiltersCollapsed('sectors')">
        <span class="collapse-icon">{{ filtersCollapsed.sectors ? '▶' : '▼' }}</span>
        <span class="filter-label">Filter by sector</span>
        <span class="active-filters-count" v-if="selectedSectors.length < availableSectors.length">
          ({{ selectedSectors.length }}/{{ availableSectors.length }})
        </span>
      </div>
      <div class="filter-content" v-if="!filtersCollapsed.sectors">
        <div class="sector-checkboxes">
          <label v-for="sector in availableSectors" :key="sector" class="sector-checkbox">
            <input 
              type="checkbox" 
              :value="sector"
              :checked="selectedSectors.includes(sector)"
              @change="toggleSector(sector)"
            />
            {{ sector }}
          </label>
        </div>
      </div>
    </div>
    
    <!-- Event Type Filters -->
    <div id="event-type-filters" v-if="type === 'event'">
      <div class="filter-header" @click="toggleFiltersCollapsed('eventTypes')">
        <span class="collapse-icon">{{ filtersCollapsed.eventTypes ? '▶' : '▼' }}</span>
        <span class="filter-label">Filter by type</span>
        <span class="active-filters-count" v-if="selectedEventTypes.length < availableEventTypes.length">
          ({{ selectedEventTypes.length }}/{{ availableEventTypes.length }})
        </span>
      </div>
      <div class="filter-content" v-if="!filtersCollapsed.eventTypes">
        <div class="filter-controls">
          <div class="button-group">
            <button 
              @click="selectAllEventTypes" 
              class="filter-btn filter-btn-left"
              :disabled="allEventTypesSelected"
            >
              All
            </button>
            <button 
              @click="clearAllEventTypes" 
              class="filter-btn filter-btn-right"
              :disabled="noEventTypesSelected"
            >
              None
            </button>
          </div>
          <div class="items-count">
            {{ filteredItemsCount }} items
          </div>
        </div>
        <div class="event-type-checkboxes">
          <label v-for="eventType in availableEventTypes" :key="eventType.value" class="event-type-checkbox">
            <input 
              type="checkbox" 
              :value="eventType.value"
              :checked="selectedEventTypes.includes(eventType.value)"
              @change="toggleEventType(eventType.value)"
            />
            <span class="type-label">{{ eventType.label }}</span>
            <span class="type-count">({{ eventType.count }})</span>
          </label>
        </div>
      </div>
    </div>
    <ul id="items-list">
      <li v-if="sortedItems.length === 0" class="empty-state">
        <p>No {{ type }}s found</p>
        <p class="empty-hint" v-if="searchQuery">Try adjusting your search</p>
        <p class="empty-hint" v-else-if="showFavoritesOnly">No favorites yet</p>
      </li>
      <template v-else-if="sortBy === 'name' || sortBy === 'sector' || sortBy === 'avenue' || sortBy === 'date'">
        <template v-for="(group, header) in groupedItems" :key="header">
          <li class="section-header" @click="toggleGroup(header)">
            <span class="collapse-icon">{{ collapsedGroups[header] ? '▶' : '▼' }}</span>
            <span class="group-label">{{ header }}</span>
            <span class="group-count">({{ group.length }})</span>
          </li>
          <template v-if="!collapsedGroups[header]">
            <li 
              v-for="item in group" 
              :key="item.uid"
              @click="selectItem(item)"
              :class="{ highlighted: item.uid === selectedId, favorited: favoriteItems.has(item.uid) }"
            >
              <span class="item-content">
                <strong>
                  {{ getItemName(item) }}
                  <span v-if="hasBeenVisited(item)" class="visited-badge">✓</span>
                </strong>
                <small>
                  <span v-if="props.type === 'event' && formatEventTime(item)" class="event-time">
                    {{ formatEventTime(item) }}
                    <span v-if="isHappeningNow(item)" class="happening-now">🔴 NOW</span>
                    •
                  </span>
                  {{ getItemLocation(item) }}
                  <span v-if="getItemDistance(item)" class="distance">• {{ getItemDistance(item) }}</span>
                </small>
              </span>
              <span class="item-actions">
                <button
                  v-if="props.type === 'event' && item.occurrence_set && item.occurrence_set.length > 0"
                  @click.stop="handleToggleSchedule(item, item.occurrence_set[0])"
                  class="schedule-btn"
                  :class="{ active: isInSchedule(item, item.occurrence_set[0]) }"
                  :title="isInSchedule(item, item.occurrence_set[0]) ? 'Remove from schedule' : 'Add to schedule'"
                >
                  {{ isInSchedule(item, item.occurrence_set[0]) ? '📅' : '📆' }}
                </button>
                <button 
                  @click.stop="handleToggleFavorite(item)"
                  class="favorite-btn"
                  :class="{ active: favoriteItems.has(item.uid) }"
                >
                  {{ favoriteItems.has(item.uid) ? '★' : '☆' }}
                </button>
              </span>
            </li>
          </template>
        </template>
      </template>
      <li 
        v-else
        v-for="item in sortedItems" 
        :key="item.uid"
        @click="selectItem(item)"
        :class="{ highlighted: item.uid === selectedId, favorited: favoriteItems.has(item.uid) }"
      >
        <span class="item-content">
          <strong>
            {{ getItemName(item) }}
            <span v-if="hasBeenVisited(item)" class="visited-badge">✓</span>
          </strong>
          <small>
            <span v-if="props.type === 'event' && formatEventTime(item)" class="event-time">
              {{ formatEventTime(item) }}
              <span v-if="isHappeningNow(item)" class="happening-now">🔴 NOW</span>
              •
            </span>
            {{ getItemLocation(item) }}
            <span v-if="getItemDistance(item)" class="distance">• {{ getItemDistance(item) }}</span>
          </small>
        </span>
        <span class="item-actions">
          <button
            v-if="props.type === 'event' && item.occurrence_set && item.occurrence_set.length > 0"
            @click.stop="handleToggleSchedule(item, item.occurrence_set[0])"
            class="schedule-btn"
            :class="{ active: isInSchedule(item, item.occurrence_set[0]) }"
            :title="isInSchedule(item, item.occurrence_set[0]) ? 'Remove from schedule' : 'Add to schedule'"
          >
            {{ isInSchedule(item, item.occurrence_set[0]) ? '📅' : '📆' }}
          </button>
          <button 
            @click.stop="handleToggleFavorite(item)"
            class="favorite-btn"
            :class="{ active: favoriteItems.has(item.uid) }"
          >
            {{ favoriteItems.has(item.uid) ? '★' : '☆' }}
          </button>
        </span>
      </li>
    </ul>
    </template>
  </section>
  </PullToRefresh>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemName, getItemLocation, extractClockPosition, extractAvenue, clockPositionToNumber, getSector, formatEventTime, isHappeningNow, getNextOccurrence } from '../utils'
import { getFromCache } from '../services/storage'
import { isFavorite, toggleFavorite, getFavorites } from '../services/favorites'
import { useGeolocation } from '../composables/useGeolocation'
import { getVisitInfo } from '../services/visits'
import { isEventScheduled, addEventToSchedule, removeEventFromSchedule } from '../services/schedule'
import { useToast } from '../composables/useToast'
import { useAutoSync } from '../composables/useAutoSync'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SyncDialog from '../components/SyncDialog.vue'
import PullToRefresh from '../components/PullToRefresh.vue'

const props = defineProps(['type', 'year'])
const router = useRouter()
const route = useRoute()
const { showSuccess, showError } = useToast()
const { showSyncDialog, checkAndAutoSync } = useAutoSync()

const items = ref([])
const loading = ref(true)
const error = ref(null)
const sortBy = ref('name')
const searchQuery = ref('')
const selectedId = computed(() => route.params.id)
const syncStatus = ref('Checking for data...')

const availableSectors = ['2:00-3:00', '3:00-4:00', '4:30-5:30', '5:30-6:30', '6:30-7:30', '7:30-8:30', '8:30-10:00']
const selectedSectors = ref([...availableSectors]) // All selected by default

// Event type filters
const availableEventTypes = ref([
  { value: 'work', label: 'Class/Workshop', count: 0 },
  { value: 'prty', label: 'Music/Party', count: 0 },
  { value: 'food', label: 'Food', count: 0 },
  { value: 'care', label: 'Self Care', count: 0 },
  { value: 'game', label: 'Games', count: 0 },
  { value: 'yoga', label: 'Yoga/Movement', count: 0 },
  { value: 'arts', label: 'Arts & Crafts', count: 0 },
  { value: 'cere', label: 'Ritual/Ceremony', count: 0 },
  { value: 'live', label: 'Live Music', count: 0 },
  { value: 'perf', label: 'Performance', count: 0 }
])
const selectedEventTypes = ref([]) // Will be populated with all types after data loads

const collapsedGroups = ref({})
const filtersCollapsed = ref({
  sectors: true,     // Start collapsed on mobile
  eventTypes: true   // Start collapsed on mobile
})
const showFavoritesOnly = ref(false)
const favoriteItems = ref(new Set())

// Geolocation
const { userLocation, locationLoading, getCurrentLocation, getDistanceTo, sortByDistance } = useGeolocation()

// Load saved sector filters from localStorage
const savedSectors = localStorage.getItem(`selectedSectors_${props.type}`)
if (savedSectors) {
  try {
    selectedSectors.value = JSON.parse(savedSectors)
  } catch (e) {
    console.error('Failed to load saved sectors:', e)
  }
}

// Load saved event type filters from localStorage  
const savedEventTypes = localStorage.getItem('selectedEventTypes')
if (savedEventTypes) {
  try {
    selectedEventTypes.value = JSON.parse(savedEventTypes)
  } catch (e) {
    console.error('Failed to load saved event types:', e)
    // Default to all types
    selectedEventTypes.value = availableEventTypes.value.map(t => t.value)
  }
} else {
  // Default to all types
  selectedEventTypes.value = availableEventTypes.value.map(t => t.value)
}

// Load saved collapsed groups from localStorage
const savedCollapsed = localStorage.getItem(`collapsedGroups_${props.type}_${sortBy.value}`)
if (savedCollapsed) {
  try {
    collapsedGroups.value = JSON.parse(savedCollapsed)
  } catch (e) {
    console.error('Failed to load collapsed groups:', e)
  }
}

// Load saved filter collapsed state from localStorage
const savedFiltersCollapsed = localStorage.getItem(`filtersCollapsed_${props.type}`)
if (savedFiltersCollapsed) {
  try {
    filtersCollapsed.value = { ...filtersCollapsed.value, ...JSON.parse(savedFiltersCollapsed) }
  } catch (e) {
    console.error('Failed to load filters collapsed state:', e)
  }
}

const toggleSector = (sector) => {
  const index = selectedSectors.value.indexOf(sector)
  if (index > -1) {
    selectedSectors.value.splice(index, 1)
  } else {
    selectedSectors.value.push(sector)
  }
  localStorage.setItem(`selectedSectors_${props.type}`, JSON.stringify(selectedSectors.value))
}

const toggleEventType = (type) => {
  const index = selectedEventTypes.value.indexOf(type)
  if (index > -1) {
    selectedEventTypes.value.splice(index, 1)
  } else {
    selectedEventTypes.value.push(type)
  }
  localStorage.setItem('selectedEventTypes', JSON.stringify(selectedEventTypes.value))
}

const selectAllEventTypes = () => {
  selectedEventTypes.value = availableEventTypes.value.map(t => t.value)
  localStorage.setItem('selectedEventTypes', JSON.stringify(selectedEventTypes.value))
}

const clearAllEventTypes = () => {
  selectedEventTypes.value = []
  localStorage.setItem('selectedEventTypes', JSON.stringify(selectedEventTypes.value))
}

const toggleGroup = (groupName) => {
  collapsedGroups.value[groupName] = !collapsedGroups.value[groupName]
  localStorage.setItem(`collapsedGroups_${props.type}_${sortBy.value}`, JSON.stringify(collapsedGroups.value))
}

const toggleFiltersCollapsed = (filterType) => {
  filtersCollapsed.value[filterType] = !filtersCollapsed.value[filterType]
  localStorage.setItem(`filtersCollapsed_${props.type}`, JSON.stringify(filtersCollapsed.value))
}

// Watch for sort changes to load appropriate collapsed state
watch(sortBy, (newSort) => {
  const savedCollapsed = localStorage.getItem(`collapsedGroups_${props.type}_${newSort}`)
  if (savedCollapsed) {
    try {
      collapsedGroups.value = JSON.parse(savedCollapsed)
    } catch (e) {
      collapsedGroups.value = {}
    }
  } else {
    collapsedGroups.value = {}
  }
})

const sortedItems = computed(() => {
  let filtered = [...items.value]
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => 
      getItemName(item).toLowerCase().includes(query)
    )
  }
  
  // Apply sector filter (only for camps and art)
  if ((props.type === 'camp' || props.type === 'art') && selectedSectors.value.length < availableSectors.length) {
    filtered = filtered.filter(item => {
      const location = getItemLocation(item)
      const clockPos = extractClockPosition(location)
      const sector = getSector(clockPos)
      return selectedSectors.value.includes(sector)
    })
  }
  
  // Apply event type filter
  if (props.type === 'event' && selectedEventTypes.value.length < availableEventTypes.value.length) {
    filtered = filtered.filter(item => {
      const eventType = item.event_type?.abbr
      return eventType && selectedEventTypes.value.includes(eventType)
    })
  }
  
  // Apply favorites filter
  if (showFavoritesOnly.value) {
    filtered = filtered.filter(item => favoriteItems.value.has(item.uid))
  }
  
  // Apply sorting
  if (sortBy.value === 'name') {
    filtered.sort((a, b) => 
      getItemName(a).toLowerCase().localeCompare(getItemName(b).toLowerCase())
    )
  } else if (sortBy.value === 'location') {
    filtered.sort((a, b) => 
      getItemLocation(a).toLowerCase().localeCompare(getItemLocation(b).toLowerCase())
    )
  } else if (sortBy.value === 'sector') {
    filtered.sort((a, b) => {
      const locA = getItemLocation(a)
      const locB = getItemLocation(b)
      const clockA = extractClockPosition(locA)
      const clockB = extractClockPosition(locB)
      const numA = clockPositionToNumber(clockA)
      const numB = clockPositionToNumber(clockB)
      return numA - numB
    })
  } else if (sortBy.value === 'avenue') {
    filtered.sort((a, b) => {
      const locA = getItemLocation(a)
      const locB = getItemLocation(b)
      const aveA = extractAvenue(locA) || 'Z'
      const aveB = extractAvenue(locB) || 'Z'
      return aveA.localeCompare(aveB)
    })
  } else if (sortBy.value === 'distance' && userLocation.value) {
    filtered = sortByDistance(filtered, getItemLocation)
  } else if (sortBy.value === 'date' && props.type === 'event') {
    // Sort by date/time
    filtered.sort((a, b) => {
      const occA = getNextOccurrence(a)
      const occB = getNextOccurrence(b)
      
      if (!occA && !occB) return 0
      if (!occA) return 1
      if (!occB) return -1
      
      const dateA = new Date(occA.start_time)
      const dateB = new Date(occB.start_time)
      return dateA - dateB
    })
  }
  
  return filtered
})

const groupedItems = computed(() => {
  const groups = {}
  
  if (sortBy.value === 'name') {
    sortedItems.value.forEach(item => {
      const name = getItemName(item)
      const firstLetter = name.charAt(0).toUpperCase()
      const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
      
      if (!groups[letter]) {
        groups[letter] = []
      }
      groups[letter].push(item)
    })
  } else if (sortBy.value === 'sector') {
    sortedItems.value.forEach(item => {
      const location = getItemLocation(item)
      const clockPos = extractClockPosition(location)
      const sector = getSector(clockPos)
      
      if (!groups[sector]) {
        groups[sector] = []
      }
      groups[sector].push(item)
    })
  } else if (sortBy.value === 'avenue') {
    sortedItems.value.forEach(item => {
      const location = getItemLocation(item)
      const avenue = extractAvenue(location) || 'Unknown'
      
      if (!groups[avenue]) {
        groups[avenue] = []
      }
      groups[avenue].push(item)
    })
  } else if (sortBy.value === 'date' && props.type === 'event') {
    // Group by day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    sortedItems.value.forEach(item => {
      const occurrence = getNextOccurrence(item)
      if (!occurrence || !occurrence.start_time) {
        if (!groups['Unknown Date']) {
          groups['Unknown Date'] = []
        }
        groups['Unknown Date'].push(item)
        return
      }
      
      const date = new Date(occurrence.start_time)
      const dayName = days[date.getDay()]
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const dayNum = date.getDate()
      const header = `${dayName}, ${month} ${dayNum}`
      
      if (!groups[header]) {
        groups[header] = []
      }
      groups[header].push(item)
    })
  }
  
  return groups
})

const handleRefresh = async () => {
  // Refresh data from cache
  await loadData()
  // Show toast notification
  const { showToast } = await import('../composables/useToast')
  showToast('Data refreshed', 'success')
}

const loadData = async () => {
  loading.value = true
  error.value = null
  
  console.log(`ListView loadData called for type: ${props.type}, year: ${props.year}`)
  
  try {
    // Only load from cache, never fetch from API
    const cachedItems = await getFromCache(props.type, props.year)
    
    console.log(`Cache returned ${cachedItems?.length || 0} items for ${props.type}`)
    
    if (cachedItems && cachedItems.length > 0) {
      console.log(`Using cached data for ${props.type}s ${props.year}`)
      items.value = cachedItems
      
      // Update event type counts if we're loading events
      if (props.type === 'event') {
        updateEventTypeCounts()
      }
    } else {
      // No cached data - trigger auto-sync
      console.log(`No cached data for ${props.type}, triggering auto-sync`)
      syncStatus.value = `Downloading ${props.type} data...`
      await checkAndAutoSync(props.type, props.year)
      return
    }
  } catch (err) {
    error.value = `Error loading ${props.type}s: ${err.message}`
    console.error(err)
  } finally {
    loading.value = false
  }
}


const selectItem = (item) => {
  console.log(`Full ${props.type} data:`, item)
  router.push(`/${props.year}/${props.type}s/${item.uid}`)
}

const favoriteCount = computed(() => {
  return items.value.filter(item => favoriteItems.value.has(item.uid)).length
})

// Smart button states for event type filters
const allEventTypesSelected = computed(() => {
  return selectedEventTypes.value.length === availableEventTypes.value.length
})

const noEventTypesSelected = computed(() => {
  return selectedEventTypes.value.length === 0
})

// Filtered items count for display
const filteredItemsCount = computed(() => {
  return sortedItems.value.length
})

const updateEventTypeCounts = () => {
  // Reset counts
  availableEventTypes.value.forEach(type => {
    type.count = 0
  })
  
  // Count events by type
  items.value.forEach(event => {
    const eventType = event.event_type?.abbr
    if (eventType) {
      const typeObj = availableEventTypes.value.find(t => t.value === eventType)
      if (typeObj) {
        typeObj.count++
      }
    }
  })
}

const handleToggleFavorite = (item) => {
  const wasAdded = toggleFavorite(props.type, item.uid)
  if (wasAdded) {
    favoriteItems.value.add(item.uid)
  } else {
    favoriteItems.value.delete(item.uid)
  }
  // Force reactivity
  favoriteItems.value = new Set(favoriteItems.value)
}

const loadFavorites = () => {
  const favs = getFavorites(props.type)
  favoriteItems.value = new Set(favs)
}

const getItemDistance = (item) => {
  if (!userLocation.value) return null
  const location = getItemLocation(item)
  if (!location || location === 'Unknown location') return null
  
  const distance = getDistanceTo(location)
  return distance?.formatted || null
}

const enableLocation = async () => {
  try {
    await getCurrentLocation()
    // If sorting by distance, resort items
    if (sortBy.value === 'distance') {
      // Force re-sort by changing and restoring sort value
      const currentSort = sortBy.value
      sortBy.value = 'name'
      await nextTick()
      sortBy.value = currentSort
    }
  } catch (err) {
    console.error('Failed to get location:', err)
  }
}

const hasBeenVisited = (item) => {
  return !!getVisitInfo(props.type, item.uid, props.year)
}

const isInSchedule = (event, occurrence) => {
  if (!occurrence || !occurrence.start_time) return false
  return isEventScheduled(event.uid, occurrence.start_time)
}

const handleToggleSchedule = (event, occurrence) => {
  if (!occurrence || !occurrence.start_time) return
  
  try {
    if (isEventScheduled(event.uid, occurrence.start_time)) {
      const removed = removeEventFromSchedule(event.uid, occurrence.start_time)
      if (removed) {
        showSuccess(`Removed "${event.title}" from schedule`)
      } else {
        showError('Failed to remove event from schedule')
      }
    } else {
      const added = addEventToSchedule(event, occurrence)
      if (added) {
        showSuccess(`Added "${event.title}" to schedule`)
      } else {
        showError('Event is already in your schedule')
      }
    }
  } catch (error) {
    console.error('Error toggling schedule:', error)
    showError('Failed to update schedule')
  }
}

onMounted(() => {
  console.log(`ListView mounted with type: ${props.type}, year: ${props.year}`)
  loadData()
  loadFavorites()
})
watch(() => [props.type, props.year], () => {
  console.log(`ListView props changed - type: ${props.type}, year: ${props.year}`)
  loadData()
  loadFavorites()
})
</script>

<style scoped>
.search-input {
  padding: 0.5rem;
  background-color: #333;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
  font-size: 1rem;
  margin-right: 1rem;
  width: 200px;
}

.search-input:focus {
  outline: none;
  border-color: #888;
}

#sector-filters, #event-type-filters {
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
  color: #ccc;
}

.filter-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.filter-header:hover {
  background-color: #333;
}

.filter-header .collapse-icon {
  margin-right: 0.5rem;
  font-size: 0.8rem;
  color: #888;
  transition: transform 0.2s, color 0.2s;
}

.filter-header:hover .collapse-icon {
  color: #ccc;
}

.filter-label {
  font-weight: bold;
  flex: 1;
}

.active-filters-count {
  font-size: 0.85rem;
  color: #888;
  margin-left: 0.5rem;
}

.filter-content {
  padding: 0 1rem 0.75rem 2rem; /* Indent to align with arrow end */
}

.sector-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.sector-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
}

.sector-checkbox input {
  margin-right: 0.25rem;
}

.sector-checkbox:hover {
  background-color: #8B0000;
  color: #fff;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  margin: 0 -0.5rem;
}


.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.button-group {
  display: flex;
}

.filter-btn {
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.filter-btn-left {
  border-radius: 4px 0 0 4px;
  border-right: none;
}

.filter-btn-right {
  border-radius: 0 4px 4px 0;
}

.filter-btn:hover:not(:disabled) {
  background: #555;
  color: #fff;
}

.filter-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}

.items-count {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
}

.event-type-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.event-type-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.event-type-checkbox input {
  margin-right: 0.5rem;
}

.event-type-checkbox:hover {
  background-color: #8B0000;
  color: #fff;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  margin: 0 -0.5rem;
}

.type-label {
  flex: 1;
}

.type-count {
  color: #888;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

#list-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #333;
  border-bottom: 1px solid #555;
}

#list-controls label {
  color: #ccc;
}

#list-controls select {
  background-color: #444;
  color: #fff;
  border: 1px solid #555;
  padding: 0.25rem;
}

.items-count {
  margin-left: auto;
  font-size: 0.9rem;
  color: #999;
  white-space: nowrap;
}

.section-header {
  background-color: #2a2a2a;
  font-weight: normal; /* Label will be bold, count will be normal */
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #444;
  color: #999;
  font-size: 1.4rem; /* Larger for prominent label */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Ensure left alignment */
  user-select: none;
}

.section-header:hover {
  background-color: #8B0000;
  color: #fff;
}

.section-header:hover .group-count {
  color: #fff;
}

.collapse-icon {
  margin-right: 0.5rem;
  font-size: 1rem; /* Proportional to header text */
}

.group-label {
  font-weight: bold; /* Prominent primary element */
  flex: 1; /* Take up available space */
}

.group-count {
  margin-left: auto; /* Push to right side for clean layout */
  font-size: 1rem; /* Smaller, secondary text */
  color: #999;
  font-weight: normal; /* Secondary element should be lighter */
}

.favorites-toggle {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.favorites-toggle:hover {
  background: #8B0000;
  color: #fff;
}

.favorites-toggle.active {
  background: #8B0000;
  color: #fff;
}

#items-list li {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#items-list li .item-content {
  flex: 1;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.schedule-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  color: #666;
  transition: all 0.2s;
}

.schedule-btn:hover {
  transform: scale(1.1);
}

.schedule-btn.active {
  color: #4CAF50;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  color: #666;
  transition: color 0.2s;
}

.favorite-btn:hover {
  color: #FFD700;
}

.favorite-btn.active {
  color: #FFD700;
}

#items-list li.favorited {
  background-color: rgba(255, 215, 0, 0.1);
}

.location-toggle {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.location-toggle:hover:not(:disabled) {
  background: #8B0000;
  color: #fff;
}

.location-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.distance {
  color: #8B0000;
  font-weight: bold;
  margin-left: 0.5rem;
}

.visited-badge {
  color: #228B22;
  font-size: 0.9em;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .day-selector {
    justify-content: center;
  }
  
  .schedule-controls {
    justify-content: center;
  }
}

/* Error and Empty States */
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.error-state p {
  margin-bottom: 1rem;
  color: #ff6666;
}

.retry-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #a00000;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-state p {
  margin: 0.5rem 0;
}

.empty-hint {
  font-size: 0.9rem;
  color: #555;
}

.event-time {
  color: #90CAF9;
  font-weight: 500;
}

.happening-now {
  color: #ff4444;
  font-weight: bold;
  font-size: 0.8rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}
</style>