<template>
  <section id="search-section" class="view">
    <div class="search-header">
      <!-- Mobile: Search input -->
      <div class="mobile-search-layout">
        <SearchInput
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          :isOnline="isOnline"
          :showSuggestions="false"
          :autoFocus="!searchQuery"
          @search="performSearch"
          @keydown="handleKeyDown"
          @suggestion-select="onSuggestionSelect"
          @suggestion-keydown="handleSuggestionKeyDown"
          ref="searchInputMobile"
        />
      </div>
      
      <!-- Desktop: Unified search bar -->
      <div class="desktop-search-layout">
        <UnifiedSearchBar
          v-model:searchQuery="searchQuery"
          :placeholder="searchPlaceholder"
          :isOnline="isOnline"
          :autoFocus="!searchQuery"
          @search="performSearch"
          @clear="clearSearch"
          @keydown="handleKeyDown"
          @suggestion-select="onSuggestionSelect"
          @suggestion-keydown="handleSuggestionKeyDown"
          ref="searchBarDesktop"
        />
      </div>
      
      <!-- Collapsible Search Options (Modes and Filters) -->
      <SearchOptions
        v-model:searchMode="searchMode"
        :includeTypes="includeTypes"
        :isOnline="isOnline"
        @modeChanged="onModeChanged"
        @toggleEverything="toggleEverything"
        @toggleFilter="toggleFilterType"
      />
      
      <!-- Search Status -->
      <div v-if="searchStatus" class="search-status">
        <span :class="searchStatusClass">{{ searchStatus }}</span>
      </div>
    </div>
    
    <div class="search-results">
      <div v-if="loading" class="search-loading">
        <div class="loading-spinner"></div>
        <span>{{ loadingMessage }}</span>
      </div>
      <div v-else-if="!searchQuery" class="hint">
        <div class="search-modes-info">
          <div class="mode-info">
            <div class="mode-icon">🔍</div>
            <h3>Keyword Search</h3>
            <p>Fast text matching - works offline</p>
          </div>
          <div class="mode-info">
            <div class="mode-icon">🧠</div>
            <h3>Semantic Search</h3>
            <p>AI understands meaning and context</p>
          </div>
          <div class="mode-info">
            <div class="mode-icon">🚀</div>
            <h3>Smart Search</h3>
            <p>Best of both - hybrid results</p>
          </div>
        </div>
        <p class="start-typing">Start typing to search across all camps, art installations, and events.</p>
      </div>
      <div v-else-if="results.length === 0 && !loading" class="no-results">
        <p>No results found for "{{ searchQuery }}"</p>
        <p class="suggestion">Try different keywords or use a different search mode.</p>
      </div>
      <div v-else class="results-list">
        <div class="results-header">
          <span>{{ displayedResults.length }} results found{{ totalItemsSearched > 0 ? ` from ${totalItemsSearched.toLocaleString()} items` : '' }}</span>
          <span v-if="searchMode !== 'keyword'" class="search-mode-badge">
            {{ searchModeLabels[searchMode] }}
          </span>
        </div>
        
        <div class="results-items">
          <SearchResultItem
            v-for="(item, index) in displayedResults"
            :key="`${item.type}-${item.uid || item.id}-${index}`"
            :item="item"
            :searchMode="searchMode"
            :year="year"
            @navigate="navigateToDetail"
            @toggle-favorite="toggleItemFavorite"
          />
        </div>
        
        <div v-if="hasMoreResults" class="load-more">
          <button @click="loadMore" class="load-more-btn">
            Load More Results
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFromCache } from '../services/storage.js'
import { isFavorite, toggleFavorite as toggleFav } from '../services/favorites.js'
import { getItemName, getItemLocation } from '../utils.js'
import { getItemNotes } from '../services/visits.js'
import SearchInput from '../components/search/SearchInput.vue'
import UnifiedSearchBar from '../components/search/UnifiedSearchBar.vue'
import SearchOptions from '../components/search/SearchOptions.vue'
import SearchResultItem from '../components/search/SearchResultItem.vue'
import { getAllInfrastructure, searchInfrastructure } from '../services/infrastructure.js'
import { 
  vectorSearch, 
  hybridSearch, 
  entitySearch,
  isVectorSearchAvailable,
  searchPreferences
} from '../services/vectorSearchService.js'

const router = useRouter()
const route = useRoute()

// Reactive state
const searchQuery = ref('')
const searchMode = ref('keyword')
const loading = ref(false)
const loadingMessage = ref('Searching...')
const results = ref([])
const currentPage = ref(1)
const pageSize = 20
const year = ref(route.params.year || localStorage.getItem('selectedYear') || '2025')
const isOnline = ref(navigator.onLine)
const searchStatus = ref('')
const searchExecutionTime = ref(null)
const fromCache = ref(false)
const showSuggestions = ref(true)
const showModeDescription = ref(false)
const totalItemsSearched = ref(0)

const includeTypes = reactive({
  camps: true,
  art: true,
  events: true,
  infrastructure: true,
  notes: true
})

const typeIcons = {
  camp: '🏠',
  art: '🎨',
  event: '🎉',
  infrastructure: '🏛️'
}

const searchModeLabels = {
  semantic: 'AI Search',
  smart: 'Smart Search',
  keyword: 'Keyword'
}

// Refs for components
const searchInputMobile = ref(null)
const searchBarDesktop = ref(null)

// Computed properties
const displayedResults = computed(() => {
  const endIndex = currentPage.value * pageSize
  return results.value.slice(0, endIndex)
})

const hasMoreResults = computed(() => {
  return results.value.length > displayedResults.value.length
})

const searchStatusClass = computed(() => {
  if (searchStatus.value.includes('error') || searchStatus.value.includes('unavailable')) {
    return 'status-error'
  }
  if (searchStatus.value.includes('offline')) {
    return 'status-offline'
  }
  return 'status-online'
})

// Types to search based on filters
const typesToSearch = computed(() => {
  const types = []
  if (includeTypes.camps) types.push('camp')
  if (includeTypes.art) types.push('art')
  if (includeTypes.events) types.push('event')
  return types
})

// Check if all filter types are selected
const everythingSelected = computed(() => {
  return includeTypes.camps && 
         includeTypes.art && 
         includeTypes.events && 
         includeTypes.infrastructure && 
         includeTypes.notes
})

// Dynamic placeholder based on selected filters
const searchPlaceholder = computed(() => {
  const selected = []
  if (includeTypes.camps) selected.push('camps')
  if (includeTypes.art) selected.push('art')
  if (includeTypes.events) selected.push('events')
  if (includeTypes.infrastructure) selected.push('infra')
  if (includeTypes.notes) selected.push('notes')
  
  if (selected.length === 0) {
    return 'Select a filter to search...'
  } else if (selected.length === 5) {
    return 'Search everything...'
  } else if (selected.length === 1) {
    return `Search ${selected[0]}...`
  } else if (selected.length === 2) {
    return `Search ${selected[0]} and ${selected[1]}...`
  } else {
    // 3 or more items: "camps, art, and events"
    const lastItem = selected.pop()
    return `Search ${selected.join(', ')}, and ${lastItem}...`
  }
})

// Save filter preferences
const saveFilterPreferences = () => {
  const prefs = {
    camps: includeTypes.camps,
    art: includeTypes.art,
    events: includeTypes.events,
    infrastructure: includeTypes.infrastructure,
    notes: includeTypes.notes
  }
  localStorage.setItem('searchFilterPreferences', JSON.stringify(prefs))
}

// Load filter preferences
const loadFilterPreferences = () => {
  const saved = localStorage.getItem('searchFilterPreferences')
  if (saved) {
    try {
      const prefs = JSON.parse(saved)
      includeTypes.camps = prefs.camps !== false
      includeTypes.art = prefs.art !== false
      includeTypes.events = prefs.events !== false
      includeTypes.infrastructure = prefs.infrastructure !== false
      includeTypes.notes = prefs.notes !== false
    } catch (e) {
      console.error('Failed to load filter preferences:', e)
    }
  }
}

// Initialize component
onMounted(async () => {
  // Load filter preferences
  loadFilterPreferences()
  
  // Check for URL parameters first
  if (route.query.q) {
    searchQuery.value = route.query.q
  }
  
  if (route.query.mode && ['keyword', 'semantic', 'smart'].includes(route.query.mode)) {
    searchMode.value = route.query.mode
  } else {
    // Load user preferences if no mode in URL
    const prefs = searchPreferences.get()
    searchMode.value = prefs.defaultMode || 'keyword'
  }
  
  showSuggestions.value = searchPreferences.get().enableSemanticSearch !== false
  
  // Check if vector search is available
  if (isOnline.value) {
    const available = await isVectorSearchAvailable()
    if (!available) {
      searchStatus.value = 'AI search temporarily unavailable'
    }
  }
  
  // If we have a query from URL, perform search
  if (searchQuery.value) {
    await performSearch()
  } else {
    // Focus search input if no query
    nextTick(() => {
      // Try desktop input first, then mobile
      if (searchBarDesktop.value) {
        searchBarDesktop.value.focus()
      } else if (searchInputMobile.value) {
        searchInputMobile.value.focus()
      }
    })
  }
})

// Search is now triggered only on Enter key
// Removed debounced search-as-you-type functionality
const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    searchQuery.value = ''
    results.value = []
  }
}

// Handle suggestion key events
const handleSuggestionKeyDown = (event) => {
  // Handle any additional keyboard events from suggestions
}

// Search mode change handler
const onModeChanged = (data) => {
  const { mode } = data
  
  // If everything is selected and user changes mode, deselect all filters
  if (everythingSelected.value) {
    includeTypes.camps = false
    includeTypes.art = false
    includeTypes.events = false
    includeTypes.infrastructure = false
    includeTypes.notes = false
    saveFilterPreferences()
  }
  
  // Save preference
  const prefs = searchPreferences.get()
  prefs.defaultMode = mode
  searchPreferences.set(prefs)
  
  // Update URL to reflect mode change
  updateURL()
  
  // Re-run search if we have a query or results
  if (searchQuery.value || results.value.length > 0) {
    performSearch()
  }
  
  // Update status
  if (mode !== 'keyword' && !isOnline.value) {
    searchStatus.value = 'This search mode requires internet connection'
  } else {
    searchStatus.value = ''
  }
}

// Select search mode
const selectMode = (mode) => {
  searchMode.value = mode
  onModeChanged({ mode })
}

// Update URL with current search parameters
const updateURL = () => {
  const query = {}
  if (searchQuery.value) query.q = searchQuery.value
  if (searchMode.value !== 'keyword') query.mode = searchMode.value
  
  router.replace({
    path: route.path,
    query
  })
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
  results.value = []
  currentPage.value = 1
  searchStatus.value = ''
  totalItemsSearched.value = 0
  updateURL()
}

// Toggle filter type
const toggleFilterType = (type) => {
  // If everything is currently selected, clicking a filter should select only that one
  if (everythingSelected.value) {
    // Deselect all
    includeTypes.camps = false
    includeTypes.art = false
    includeTypes.events = false
    includeTypes.infrastructure = false
    includeTypes.notes = false
    // Select only the clicked one
    includeTypes[type] = true
  } else {
    // Normal toggle behavior
    includeTypes[type] = !includeTypes[type]
  }
  
  saveFilterPreferences()
  
  // Re-run search if we have results or a query
  if (searchQuery.value || results.value.length > 0) {
    performSearch()
  }
}

// Toggle everything on/off
const toggleEverything = () => {
  if (everythingSelected.value) {
    // If everything is selected, deselect all
    includeTypes.camps = false
    includeTypes.art = false
    includeTypes.events = false
    includeTypes.infrastructure = false
    includeTypes.notes = false
  } else {
    // If not everything is selected, select all
    includeTypes.camps = true
    includeTypes.art = true
    includeTypes.events = true
    includeTypes.infrastructure = true
    includeTypes.notes = true
  }
  
  saveFilterPreferences()
  
  // Re-run search if we have results or a query
  if (searchQuery.value || results.value.length > 0) {
    performSearch()
  }
}

// Suggestion selection
const onSuggestionSelect = (suggestion) => {
  searchQuery.value = suggestion
  performSearch()
}

// Matches infrastructure search
const matchesInfrastructureSearch = (item, query) => {
  const q = query.toLowerCase()
  const name = item.name?.toLowerCase() || ''
  const description = item.description?.toLowerCase() || ''
  const category = item.category?.toLowerCase() || ''
  const location = item.location?.toLowerCase() || ''
  const services = (item.services || []).join(' ').toLowerCase()
  
  return name.includes(q) || 
         description.includes(q) || 
         category.includes(q) || 
         location.includes(q) || 
         services.includes(q)
}

// Perform search
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }
  
  const query = searchQuery.value.trim()
  loading.value = true
  loadingMessage.value = searchMode.value === 'keyword' 
    ? 'Searching...' 
    : 'AI is understanding your search...'
  results.value = []
  currentPage.value = 1
  const startTime = Date.now()
  totalItemsSearched.value = 0
  
  try {
    let searchResults = []
    
    if (searchMode.value === 'keyword' || !isOnline.value) {
      // Keyword search (works offline)
      const lowerQuery = query.toLowerCase()
      let allResults = []
      
      // Search camps
      if (includeTypes.camps && typesToSearch.value.includes('camp')) {
        const camps = await getFromCache('camp', year.value)
        totalItemsSearched.value += camps.length
        const campResults = camps.filter(camp => {
          const name = getItemName(camp).toLowerCase()
          const description = (camp.description || '').toLowerCase()
          const hometown = (camp.hometown || '').toLowerCase()
          const location = getItemLocation(camp).toLowerCase()
          
          return name.includes(lowerQuery) || 
                 description.includes(lowerQuery) || 
                 hometown.includes(lowerQuery) ||
                 location.includes(lowerQuery)
        }).map(camp => ({ ...camp, type: 'camp' }))
        
        allResults.push(...campResults)
      }
      
      // Search art
      if (includeTypes.art && typesToSearch.value.includes('art')) {
        const art = await getFromCache('art', year.value)
        totalItemsSearched.value += art.length
        const artResults = art.filter(item => {
          const name = getItemName(item).toLowerCase()
          const artist = (item.artist || '').toLowerCase()
          const description = (item.description || '').toLowerCase()
          const location = getItemLocation(item).toLowerCase()
          
          return name.includes(lowerQuery) || 
                 artist.includes(lowerQuery) || 
                 description.includes(lowerQuery) ||
                 location.includes(lowerQuery)
        }).map(item => ({ ...item, type: 'art' }))
        
        allResults.push(...artResults)
      }
      
      // Search events
      if (includeTypes.events && typesToSearch.value.includes('event')) {
        const events = await getFromCache('event', year.value)
        totalItemsSearched.value += events.length
        const eventResults = events.filter(event => {
          const title = (event.title || '').toLowerCase()
          const description = (event.description || '').toLowerCase()
          const campName = (event.camp_name || '').toLowerCase()
          const location = getItemLocation(event).toLowerCase()
          const eventType = (event.event_type?.label || '').toLowerCase()
          
          return title.includes(lowerQuery) || 
                 description.includes(lowerQuery) || 
                 campName.includes(lowerQuery) ||
                 location.includes(lowerQuery) ||
                 eventType.includes(lowerQuery)
        }).map(event => ({ ...event, type: 'event' }))
        
        allResults.push(...eventResults)
      }
      
      // Search infrastructure
      if (includeTypes.infrastructure) {
        const infraItems = getAllInfrastructure()
        totalItemsSearched.value += infraItems.length
        const infraResults = infraItems
          .filter(item => matchesInfrastructureSearch(item, query))
          .map(item => ({ ...item, type: 'infrastructure' }))
        
        allResults.push(...infraResults)
      }
      
      // Search personal notes
      if (includeTypes.notes) {
        const notesResults = []
        for (const type of ['camp', 'art']) {
          const items = await getFromCache(type, year.value)
          for (const item of items) {
            const note = getItemNotes(type, item.uid)
            if (note && note.toLowerCase().includes(lowerQuery)) {
              notesResults.push({
                ...item,
                type,
                matchReason: 'personal note',
                noteSnippet: note.substring(0, 100) + (note.length > 100 ? '...' : '')
              })
            }
          }
        }
        allResults.push(...notesResults)
      }
      
      searchResults = allResults
      searchStatus.value = searchMode.value === 'keyword' 
        ? '' 
        : 'Offline - showing keyword results'
    } else {
      // Vector or hybrid search (requires internet)
      let apiResults
      
      if (searchMode.value === 'semantic') {
        const response = await vectorSearch(
          query, 
          typesToSearch.value, 
          parseInt(year.value)
        )
        apiResults = response.results
        fromCache.value = response.cached || false
        searchExecutionTime.value = response.execution_time
      } else if (searchMode.value === 'smart') {
        const response = await hybridSearch(
          query, 
          typesToSearch.value, 
          parseInt(year.value)
        )
        apiResults = response.results
        fromCache.value = response.cached || false
        searchExecutionTime.value = response.execution_time
      }
      
      searchResults = apiResults || []
      
      // Add infrastructure results if included
      if (includeTypes.infrastructure) {
        const infraResults = searchInfrastructure(query)
          .map(item => ({ ...item, type: 'infrastructure' }))
        searchResults.push(...infraResults)
      }
      
      searchStatus.value = ''
    }
    
    results.value = searchResults
    
    // Update URL with search query
    updateURL()
    
  } catch (error) {
    console.error('Search error:', error)
    searchStatus.value = `Search error: ${error.message}`
    results.value = []
  } finally {
    loading.value = false
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    // Update execution time display
    if (searchMode.value !== 'keyword' && searchExecutionTime.value) {
      searchStatus.value = `Search completed in ${searchExecutionTime.value}s`
    } else {
      searchStatus.value = ''
    }
  }
}

// Navigate to detail view
const navigateToDetail = (item) => {
  if (item.type === 'event') {
    router.push(`/${year.value}/events/${item.uid}`)
  } else if (item.type === 'infrastructure') {
    router.push(`/${year.value}/infrastructure/${item.id}`)
  } else {
    router.push(`/${year.value}/${item.type}/${item.uid}`)
  }
}

// Toggle favorite
const toggleItemFavorite = async (item) => {
  await toggleFav(item.type, item.uid)
  // Force re-render by updating the item
  const index = results.value.findIndex(r => r.uid === item.uid && r.type === item.type)
  if (index !== -1) {
    results.value[index] = { ...results.value[index] }
  }
}

// Load more results
const loadMore = () => {
  currentPage.value++
}
</script>

<style scoped>
.view {
  padding: 1rem;
  color: #f0f0f0;
  background: #1a1a1a;
  min-height: 100vh;
}

.search-header {
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* Mobile/Desktop layout switching */
.mobile-search-layout {
  display: block;
}

.desktop-search-layout {
  display: none;
}

@media (min-width: 601px) {
  .mobile-search-layout {
    display: none;
  }
  
  .desktop-search-layout {
    display: block;
  }
}

/* Search status */
.search-status {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
}

.search-status span {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.status-error {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.status-offline {
  color: #ffd93d;
  background: rgba(255, 217, 61, 0.1);
}

.status-online {
  color: var(--color-dark-red);
}

/* Search results */
.search-results {
  max-width: 800px;
  margin: 0 auto;
}

.search-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top: 3px solid #680000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hint {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.search-modes-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.mode-info {
  text-align: center;
  padding: 1.5rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  transition: all 0.2s ease;
}

@media (min-width: 601px) {
  .mode-info:hover {
    border-color: #680000 !important;
    background: rgba(104, 0, 0, 0.1);
  }
}

.mode-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.mode-info h3 {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #fff;
}

.mode-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #999;
}

.start-typing {
  font-size: 1.1rem;
  color: #666;
}

.no-results {
  text-align: center;
  padding: 3rem 2rem;
}

.no-results p {
  margin: 0.5rem 0;
}

.suggestion {
  color: #999;
  font-size: 0.9rem;
}

.results-list {
  margin-top: 1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #333;
  color: #999;
  font-size: 0.9rem;
}

.search-mode-badge {
  background: var(--color-dark-red);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.results-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
}

.load-more-btn {
  background: var(--color-dark-red);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  text-transform: uppercase;
}

.load-more-btn:hover {
  background: var(--color-dark-red-original);
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .view {
    padding: 0.75rem;
  }
  
  .search-header {
    margin-bottom: 1rem;
  }
  
  .search-modes-info {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .mode-info {
    padding: 1rem;
  }
  
  .mode-icon {
    font-size: 2rem;
  }
  
  .mode-info h3 {
    font-size: 1rem;
  }
  
  .mode-info p {
    font-size: 0.85rem;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>