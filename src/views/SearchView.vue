<template>
  <section id="search-section" class="view">
    <div class="search-header">
      <h2>Search Everything</h2>
      
      <!-- Search Mode Selector -->
      <SearchModeSelector 
        v-model:selectedMode="searchMode"
        :isOnline="isOnline"
        :showDescription="showModeDescription"
        @modeChanged="onModeChanged"
      />
      
      <div class="search-input-container">
        <input 
          v-model="searchQuery"
          @keydown.enter="performSearch"
          @keydown="handleKeyDown"
          type="text"
          placeholder="Search camps, art, events... (press Enter)"
          class="search-input"
          ref="searchInput"
        >
        
        <!-- Search Suggestions -->
        <SearchSuggestions
          :query="searchQuery"
          :isOnline="isOnline"
          :enabled="false"
          @select="onSuggestionSelect"
          @keydown="handleSuggestionKeyDown"
          ref="suggestionsRef"
        />
      </div>
      
      <!-- Search Status -->
      <div v-if="searchStatus" class="search-status">
        <span :class="searchStatusClass">{{ searchStatus }}</span>
      </div>
    </div>
    
    <div class="search-filters">
      <label class="filter-checkbox">
        <input type="checkbox" v-model="includeTypes.camps" @change="performSearch">
        🏠 Camps
      </label>
      <label class="filter-checkbox">
        <input type="checkbox" v-model="includeTypes.art" @change="performSearch">
        🎨 Art
      </label>
      <label class="filter-checkbox">
        <input type="checkbox" v-model="includeTypes.events" @change="performSearch">
        🎉 Events
      </label>
    </div>
    
    <div class="search-results">
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <span>{{ loadingMessage }}</span>
      </div>
      <div v-else-if="!searchQuery" class="hint">
        <div class="search-modes-info">
          <div class="mode-info">
            <span class="mode-icon">🔍</span>
            <div>
              <strong>Keyword Search</strong>
              <p>Fast text matching - works offline</p>
            </div>
          </div>
          <div v-if="isOnline" class="mode-info">
            <span class="mode-icon">🧠</span>
            <div>
              <strong>Semantic Search</strong>
              <p>AI understands meaning and context</p>
            </div>
          </div>
          <div v-if="isOnline" class="mode-info">
            <span class="mode-icon">⚡</span>
            <div>
              <strong>Smart Search</strong>
              <p>Best of both - hybrid results</p>
            </div>
          </div>
        </div>
        <p>Start typing to search across all camps, art installations, and events</p>
      </div>
      <div v-else-if="results.length === 0 && !loading" class="no-results">
        <div class="no-results-content">
          <h3>No results found for "{{ searchQuery }}"</h3>
          <div class="search-suggestions-help">
            <p v-if="searchMode === 'keyword'">Try:</p>
            <p v-else>Try switching search modes or:</p>
            <ul>
              <li v-if="searchMode !== 'semantic' && isOnline">Using <strong>Semantic search</strong> to find by meaning</li>
              <li>Different keywords or phrases</li>
              <li>Checking your spelling</li>
              <li>Using more general terms</li>
            </ul>
          </div>
        </div>
      </div>
      <div v-else class="results-list">
        <div class="results-header">
          <div class="results-count">
            {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} found
            <span v-if="searchExecutionTime" class="execution-time">
              ({{ searchExecutionTime }}ms{{ fromCache ? ', cached' : '' }})
            </span>
          </div>
          <div v-if="searchMode !== 'keyword'" class="search-mode-badge">
            {{ searchModeLabels[searchMode] }}
          </div>
        </div>
        
        <SearchResultItem
          v-for="result in paginatedResults"
          :key="`${result.type}-${result.item.uid}`"
          :result="result"
          :searchMode="searchMode"
          :showSimilarityScore="searchMode !== 'keyword'"
          @navigate="navigateToItem"
          @toggleFavorite="toggleFavorite"
        />
        
        <div v-if="hasMore" class="load-more">
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
import SearchModeSelector from '../components/search/SearchModeSelector.vue'
import SearchResultItem from '../components/search/SearchResultItem.vue'
import SearchSuggestions from '../components/search/SearchSuggestions.vue'
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

const includeTypes = reactive({
  camps: true,
  art: true,
  events: true
})

const typeIcons = {
  camp: '🏠',
  art: '🎨',
  event: '🎉'
}

const searchModeLabels = {
  semantic: 'AI Search',
  smart: 'Smart Search',
  keyword: 'Keyword'
}

// Refs for components
const searchInput = ref(null)
const suggestionsRef = ref(null)

// Computed properties
const paginatedResults = computed(() => {
  const end = currentPage.value * pageSize
  return results.value.slice(0, end)
})

const hasMore = computed(() => {
  return results.value.length > currentPage.value * pageSize
})

const searchStatusClass = computed(() => {
  if (searchStatus.value.includes('offline')) return 'status-offline'
  if (searchStatus.value.includes('error')) return 'status-error'
  if (searchStatus.value.includes('cached')) return 'status-cached'
  return 'status-online'
})

const selectedTypes = computed(() => {
  const types = []
  if (includeTypes.camps) types.push('camp')
  if (includeTypes.art) types.push('art')
  if (includeTypes.events) types.push('event')
  return types
})

// Watch for online status changes
watch(() => navigator.onLine, (online) => {
  isOnline.value = online
  if (!online && searchMode.value !== 'keyword') {
    searchStatus.value = 'Switched to keyword search (offline)'
    searchMode.value = 'keyword'
    performSearch()
  }
})

// Update URL with search parameters
function updateURL() {
  const query = {}
  
  if (searchQuery.value) {
    query.q = searchQuery.value
  }
  
  if (searchMode.value && searchMode.value !== 'keyword') {
    query.mode = searchMode.value
  }
  
  // Update URL without triggering navigation
  router.replace({
    name: 'search',
    params: { year: year.value },
    query
  })
}

// Initialize component
onMounted(async () => {
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
  }
  
  // Focus search input
  nextTick(() => {
    if (searchInput.value && !searchQuery.value) {
      searchInput.value.focus()
    }
  })
})

// Search is now triggered only on Enter key
// Removed debounced search-as-you-type functionality

// Keyboard handling
const handleKeyDown = (event) => {
  if (suggestionsRef.value) {
    suggestionsRef.value.handleKeyDown(event)
  }
}

const handleSuggestionKeyDown = (event) => {
  // Handle any additional keyboard events from suggestions
}

// Search mode change handler
const onModeChanged = (data) => {
  const { mode } = data
  
  // Save preference
  const prefs = searchPreferences.get()
  prefs.defaultMode = mode
  searchPreferences.set(prefs)
  
  // Update URL to reflect mode change
  updateURL()
  
  // Don't auto-search on mode change anymore
  // User must press Enter to search
  
  // Update status
  if (mode !== 'keyword' && !isOnline.value) {
    searchStatus.value = 'This search mode requires internet connection'
  } else {
    searchStatus.value = ''
  }
}

// Suggestion selection
const onSuggestionSelect = (suggestion) => {
  searchQuery.value = suggestion
  performSearch()
}

// Main search function
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    results.value = []
    searchStatus.value = ''
    updateURL() // Clear URL when search is cleared
    return
  }
  
  loading.value = true
  loadingMessage.value = getLoadingMessage()
  currentPage.value = 1
  searchExecutionTime.value = null
  fromCache.value = false
  
  // Update URL with current search state
  updateURL()
  
  try {
    let searchResults = []
    
    if (searchMode.value === 'keyword' || !isOnline.value) {
      // Keyword search (existing logic)
      searchResults = await performKeywordSearch()
      searchStatus.value = isOnline.value ? '' : 'Offline - using keyword search'
    } else {
      // Vector/semantic search
      searchResults = await performVectorSearch()
    }
    
    results.value = searchResults
  } catch (error) {
    console.error('Search error:', error)
    searchStatus.value = `Search error: ${error.message}`
    
    // Fallback to keyword search on error
    if (searchMode.value !== 'keyword') {
      searchStatus.value += ' - falling back to keyword search'
      try {
        results.value = await performKeywordSearch()
      } catch (fallbackError) {
        results.value = []
      }
    }
  } finally {
    loading.value = false
  }
}

const getLoadingMessage = () => {
  switch (searchMode.value) {
    case 'semantic':
      return 'AI is understanding your search...'
    case 'smart':
      return 'Finding the best results...'
    default:
      return 'Searching...'
  }
}

// Keyword search (existing logic)
const performKeywordSearch = async () => {
  const query = searchQuery.value.toLowerCase()
  const searchResults = []
  
  // Search camps
  if (includeTypes.camps) {
    const camps = await getFromCache('camp', parseInt(year.value) || 2024)
    if (camps) {
      camps.forEach(camp => {
        if (matchesSearch(camp, query)) {
          searchResults.push({
            type: 'camp',
            item: camp,
            isFavorited: isFavorite('camp', camp.uid)
          })
        }
      })
    }
  }
  
  // Search art
  if (includeTypes.art) {
    const art = await getFromCache('art', parseInt(year.value) || 2024)
    if (art) {
      art.forEach(artPiece => {
        if (matchesSearch(artPiece, query)) {
          searchResults.push({
            type: 'art',
            item: artPiece,
            isFavorited: isFavorite('art', artPiece.uid)
          })
        }
      })
    }
  }
  
  // Search events
  if (includeTypes.events) {
    const events = await getFromCache('event', parseInt(year.value) || 2024)
    if (events) {
      events.forEach(event => {
        if (matchesSearch(event, query)) {
          searchResults.push({
            type: 'event',
            item: event,
            isFavorited: isFavorite('event', event.uid)
          })
        }
      })
    }
  }
  
  // Sort by relevance (name matches first)
  searchResults.sort((a, b) => {
    const aName = getItemName(a.item).toLowerCase()
    const bName = getItemName(b.item).toLowerCase()
    const aNameMatch = aName.includes(query)
    const bNameMatch = bName.includes(query)
    
    if (aNameMatch && !bNameMatch) return -1
    if (!aNameMatch && bNameMatch) return 1
    
    return aName.localeCompare(bName)
  })
  
  return searchResults
}

// Vector search implementation
const performVectorSearch = async () => {
  const searchOptions = {
    year: parseInt(year.value) || 2024,
    types: selectedTypes.value,
    limit: 50 // Get more results for better ranking
  }
  
  let apiResults
  
  try {
    if (searchMode.value === 'semantic') {
      apiResults = await vectorSearch(searchQuery.value, searchOptions)
    } else if (searchMode.value === 'smart') {
      apiResults = await hybridSearch(searchQuery.value, searchOptions)
    }
    
    // Update execution time and cache status
    searchExecutionTime.value = apiResults.meta?.execution_time || null
    fromCache.value = apiResults.fromCache || false
    
    // Convert API results to our format
    const searchResults = apiResults.results.map(result => ({
      type: result.type,
      item: {
        uid: result.uid,
        name: result.name,
        description: result.description,
        ...result.metadata
      },
      similarity_score: result.similarity_score,
      entities: result.entities,
      isFavorited: isFavorite(result.type, result.uid)
    }))
    
    searchStatus.value = fromCache.value ? 'Results from cache' : ''
    
    return searchResults
  } catch (error) {
    throw error
  }
}

// Existing keyword matching function
const matchesSearch = (item, query) => {
  const name = getItemName(item).toLowerCase()
  const location = getItemLocation(item).toLowerCase()
  const description = (item.description || '').toLowerCase()
  const hometown = (item.hometown || '').toLowerCase()
  
  // Check personal notes for this item
  const itemType = item.occurrence_set ? 'event' : item.artist ? 'art' : 'camp'
  const notes = getItemNotes(itemType, item.uid, year.value).toLowerCase()
  
  return name.includes(query) || 
         location.includes(query) || 
         description.includes(query) ||
         hometown.includes(query) ||
         notes.includes(query)
}

// Navigation and interaction
const navigateToItem = (result) => {
  // Use the correct route pattern from other views
  router.push(`/${year.value}/${result.type}s/${result.item.uid}`)
}

const toggleFavorite = (result) => {
  const newState = toggleFav(result.type, result.item.uid)
  result.isFavorited = newState
}

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
  box-sizing: border-box;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  overflow-x: hidden;
}

.search-header {
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.search-header h2 {
  margin: 0 0 1rem 0;
  color: #fff;
}

.search-input-container {
  position: relative;
  margin-bottom: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 8px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  max-width: 100%;
}

.search-input:focus {
  outline: none;
  border-color: #8B0000;
}

.search-status {
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.status-offline {
  color: #ff9800;
}

.status-error {
  color: #f44336;
}

.status-cached {
  color: #4caf50;
}

.status-online {
  color: #8B0000;
}

.search-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  cursor: pointer;
  transition: color 0.2s ease;
}

.filter-checkbox:hover {
  color: #8B0000;
}

.filter-checkbox input {
  cursor: pointer;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  color: #999;
  padding: 2rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #333;
  border-top: 3px solid #8B0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hint {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.search-modes-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.mode-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;
}

.mode-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.mode-info strong {
  color: #fff;
  display: block;
  margin-bottom: 0.25rem;
}

.mode-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #ccc;
}

.no-results {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.no-results-content h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.search-suggestions-help {
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
}

.search-suggestions-help ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.search-suggestions-help li {
  margin: 0.25rem 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.results-count {
  color: #999;
  font-size: 0.9rem;
}

.execution-time {
  color: #666;
  font-size: 0.8rem;
}

.search-mode-badge {
  background: #8B0000;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  display: none;
}

.results-list {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
}

.load-more {
  text-align: center;
  margin-top: 1rem;
}

.load-more-btn {
  background: #8B0000;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}

.load-more-btn:hover {
  background: #a50000;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .view {
    padding: 1rem;
  }
  
  .search-header {
    margin-bottom: 1rem;
  }
  
  .search-filters {
    gap: 0.5rem;
  }
  
  .filter-checkbox {
    font-size: 0.9rem;
  }
  
  .search-modes-info {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .mode-info {
    padding: 0.75rem;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>