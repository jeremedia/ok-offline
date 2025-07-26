<template>
  <section id="list-section" class="view">
    <LoadingSpinner v-if="loading" message="Loading data..." />
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
    <div id="sector-filters" v-if="type === 'camp' || type === 'art'">
      <div class="filter-label">Filter by sector:</div>
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
    <ul id="items-list">
      <li v-if="sortedItems.length === 0" class="empty-state">
        <p>No {{ type }}s found</p>
        <p class="empty-hint" v-if="searchQuery">Try adjusting your search</p>
        <p class="empty-hint" v-else-if="showFavoritesOnly">No favorites yet</p>
      </li>
      <template v-else-if="sortBy === 'name' || sortBy === 'sector' || sortBy === 'avenue'">
        <template v-for="(group, header) in groupedItems" :key="header">
          <li class="section-header" @click="toggleGroup(header)">
            <span class="collapse-icon">{{ collapsedGroups[header] ? '▶' : '▼' }}</span>
            {{ header }}
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
                  {{ getItemLocation(item) }}
                  <span v-if="getItemDistance(item)" class="distance">• {{ getItemDistance(item) }}</span>
                </small>
              </span>
              <button 
                @click.stop="handleToggleFavorite(item)"
                class="favorite-btn"
                :class="{ active: favoriteItems.has(item.uid) }"
              >
                {{ favoriteItems.has(item.uid) ? '★' : '☆' }}
              </button>
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
            {{ getItemLocation(item) }}
            <span v-if="getItemDistance(item)" class="distance">• {{ getItemDistance(item) }}</span>
          </small>
        </span>
        <button 
          @click.stop="handleToggleFavorite(item)"
          class="favorite-btn"
          :class="{ active: favoriteItems.has(item.uid) }"
        >
          {{ favoriteItems.has(item.uid) ? '★' : '☆' }}
        </button>
      </li>
    </ul>
    </template>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemName, getItemLocation, extractClockPosition, extractAvenue, clockPositionToNumber, getSector } from '../utils'
import { getFromCache } from '../services/storage'
import { isFavorite, toggleFavorite, getFavorites } from '../services/favorites'
import { useGeolocation } from '../composables/useGeolocation'
import { getVisitInfo } from '../services/visits'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const props = defineProps(['type', 'year'])
const router = useRouter()
const route = useRoute()

const items = ref([])
const loading = ref(true)
const error = ref(null)
const sortBy = ref('name')
const searchQuery = ref('')
const selectedId = computed(() => route.params.id)

const availableSectors = ['2:00-3:00', '3:00-4:00', '4:30-5:30', '5:30-6:30', '6:30-7:30', '7:30-8:30', '8:30-10:00']
const selectedSectors = ref([...availableSectors]) // All selected by default
const collapsedGroups = ref({})
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

// Load saved collapsed groups from localStorage
const savedCollapsed = localStorage.getItem(`collapsedGroups_${props.type}_${sortBy.value}`)
if (savedCollapsed) {
  try {
    collapsedGroups.value = JSON.parse(savedCollapsed)
  } catch (e) {
    console.error('Failed to load collapsed groups:', e)
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

const toggleGroup = (groupName) => {
  collapsedGroups.value[groupName] = !collapsedGroups.value[groupName]
  localStorage.setItem(`collapsedGroups_${props.type}_${sortBy.value}`, JSON.stringify(collapsedGroups.value))
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
  }
  
  return groups
})

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
    } else {
      // No cached data - redirect to settings page
      console.log(`No cached data for ${props.type}, redirecting to settings`)
      router.push('/settings')
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

#sector-filters {
  padding: 0.75rem 1rem;
  background-color: #2a2a2a;
  border-bottom: 1px solid #444;
  color: #ccc;
}

.filter-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
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
  font-weight: bold;
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #444;
  color: #999;
  font-size: 2.2rem;
  display: flex;
  align-items: center;
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
  font-size: 1.5rem;
}

.group-count {
  margin-left: 0.5rem;
  font-size: 1.5rem;
  color: #999;
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
</style>