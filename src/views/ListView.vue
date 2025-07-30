<template>
  <PullToRefresh @refresh="handleRefresh">
  <section id="list-section" class="view list-view-container">
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
    <ListControls
      :type="props.type"
      :search-query="searchQuery"
      @update:search-query="searchQuery = $event"
      :sort-by="sortBy"
      @update:sort-by="sortBy = $event"
      :selected-sectors="selectedSectors"
      :available-sectors="availableSectors"
      @toggle-sector="toggleSector"
      @select-all-sectors="selectAllSectors"
      @clear-all-sectors="clearAllSectors"
      :selected-event-types="selectedEventTypes"
      :available-event-types="availableEventTypes"
      @toggle-event-type="toggleEventType"
      @select-all-event-types="selectAllEventTypes"
      @clear-all-event-types="clearAllEventTypes"
      :show-favorites-only="showFavoritesOnly"
      @toggle-favorites="showFavoritesOnly = !showFavoritesOnly"
      :favorite-count="favoriteCount"
      :user-location="userLocation"
      :location-loading="locationLoading"
      @enable-location="enableLocation"
      :filters-collapsed="globalFiltersCollapsed"
      @update:filters-collapsed="globalFiltersCollapsed = $event"
      :loading="loading"
      :error="error"
      :visible-items="sortedItems.length"
      :total-items="items.length"
      @clear-all-filters="handleClearAllFilters"
    />
    <ul id="items-list">
      <li v-if="sortedItems.length === 0" class="empty-state">
        <p>No {{ type }}s found</p>
        <p class="empty-hint" v-if="searchQuery">Try adjusting your search</p>
        <p class="empty-hint" v-else-if="showFavoritesOnly">No favorites yet</p>
      </li>
      <template v-else-if="sortBy === 'name' || sortBy === 'sector' || sortBy === 'avenue' || sortBy === 'date'">
        <template v-for="(group, header) in groupedItems" :key="header">
          <li class="section-header" @click="toggleGroup(header, $event)">
            <span class="collapse-icon">{{ collapsedGroups[header] ? '▶' : '▼' }}</span>
            <span class="group-label">{{ header }}</span>
            <span class="group-count">{{ group.length }}</span>
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
                  <span v-if="item.isCustom" class="custom-indicator" title="Custom Entry">✏️</span>
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
    <FloatingActionButton 
      v-if="!loading && !error"
      :icon="'+'"
      :label="`Add custom ${props.type}`"
      @click="openCustomForm"
    />
    <CustomCampForm 
      v-if="props.type === 'camp'"
      v-model="showCustomForm"
      :year="props.year"
      @saved="handleCustomSaved"
    />
    <CustomArtForm 
      v-if="props.type === 'art'"
      v-model="showCustomForm"
      :year="props.year"
      @saved="handleCustomSaved"
    />
    <CustomEventForm 
      v-if="props.type === 'event'"
      v-model="showCustomForm"
      :year="props.year"
      @saved="handleCustomSaved"
    />
  </section>
  </PullToRefresh>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemName, getItemLocation, extractClockPosition, extractAvenue, clockPositionToNumber, getSector, formatEventTime, isHappeningNow, getNextOccurrence } from '../utils'
import { getFromCache } from '../services/storage'
import { getCombinedData } from '../services/customEntries'
import { isFavorite, toggleFavorite, getFavorites } from '../services/favorites'
import { useGeolocation } from '../composables/useGeolocation'
import { getVisitInfo } from '../services/visits'
import { isEventScheduled, addEventToSchedule, removeEventFromSchedule } from '../services/schedule'
import { useToast } from '../composables/useToast'
import { useAutoSync } from '../composables/useAutoSync'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SyncDialog from '../components/SyncDialog.vue'
import PullToRefresh from '../components/PullToRefresh.vue'
import ListControls from '../components/ListControls.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import CustomCampForm from '../components/forms/CustomCampForm.vue'
import CustomArtForm from '../components/forms/CustomArtForm.vue'
import CustomEventForm from '../components/forms/CustomEventForm.vue'

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
const showCustomForm = ref(false)

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
const globalFiltersCollapsed = ref(true) // Unified filters collapsed state
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
    globalFiltersCollapsed.value = JSON.parse(savedFiltersCollapsed)
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

const toggleGroup = (groupName, event) => {
  // Command+click (or Ctrl+click on Windows) toggles all groups
  if (event?.metaKey || event?.ctrlKey) {
    const allCollapsed = Object.values(collapsedGroups.value).every(collapsed => collapsed)
    
    // If all are collapsed, expand all. If any are expanded, collapse all
    const newState = allCollapsed
    
    // Set all groups to the new state
    Object.keys(groupedItems.value).forEach(key => {
      collapsedGroups.value[key] = newState
    })
  } else {
    // Normal click - just toggle this group
    collapsedGroups.value[groupName] = !collapsedGroups.value[groupName]
  }
  
  localStorage.setItem(`collapsedGroups_${props.type}_${sortBy.value}`, JSON.stringify(collapsedGroups.value))
}

const selectAllSectors = () => {
  selectedSectors.value = [...availableSectors]
  localStorage.setItem(`selectedSectors_${props.type}`, JSON.stringify(selectedSectors.value))
}

const clearAllSectors = () => {
  selectedSectors.value = []
  localStorage.setItem(`selectedSectors_${props.type}`, JSON.stringify(selectedSectors.value))
}

const handleClearAllFilters = () => {
  // Clear search
  searchQuery.value = ''
  
  // Clear sector filters
  selectedSectors.value = [...availableSectors]
  localStorage.setItem(`selectedSectors_${props.type}`, JSON.stringify(selectedSectors.value))
  
  // Clear event type filters
  selectedEventTypes.value = availableEventTypes.value.map(t => t.value)
  localStorage.setItem('selectedEventTypes', JSON.stringify(selectedEventTypes.value))
  
  // Clear favorites filter
  showFavoritesOnly.value = false
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
  
  // After setting collapsed state, ensure new groups default to collapsed
  // This will be handled in the groupedItems computed property
})

// Watch for filters collapsed changes to save to localStorage
watch(globalFiltersCollapsed, (newValue) => {
  localStorage.setItem(`filtersCollapsed_${props.type}`, JSON.stringify(newValue))
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
  
  // Ensure all groups default to collapsed (true)
  Object.keys(groups).forEach(groupName => {
    if (!(groupName in collapsedGroups.value)) {
      collapsedGroups.value[groupName] = true // Default to collapsed
    }
  })
  
  // Auto-open groups with 5 or fewer items when filtering is active
  const isFiltering = searchQuery.value.trim() || 
                     selectedSectors.value.length < availableSectors.length ||
                     (props.type === 'event' && selectedEventTypes.value.length < availableEventTypes.value.length) ||
                     showFavoritesOnly.value
  
  if (isFiltering) {
    Object.keys(groups).forEach(groupName => {
      if (groups[groupName].length <= 5) {
        collapsedGroups.value[groupName] = false // Auto-open small filtered groups
      }
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
    // Load combined data (API + custom entries)
    const combinedItems = await getCombinedData(props.type, props.year)
    
    console.log(`Combined data returned ${combinedItems?.length || 0} items for ${props.type}`)
    
    if (combinedItems && combinedItems.length > 0) {
      console.log(`Using combined data for ${props.type}s ${props.year}`)
      items.value = combinedItems
      
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

const openCustomForm = () => {
  showCustomForm.value = true
}

const handleCustomSaved = async (uid) => {
  // Reload data to include the new custom entry
  await loadData()
  showSuccess(`Custom ${props.type} added successfully!`)
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
  font-size: 0.85rem; /* Match results count text size */
  color: #999;
  font-weight: normal; /* Secondary element should be lighter */
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

.custom-indicator {
  font-size: 0.9em;
  margin-left: 0.25rem;
  vertical-align: middle;
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

.list-view-container {
  /* Container for sticky positioning within main scroll area */
  min-height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
}
</style>