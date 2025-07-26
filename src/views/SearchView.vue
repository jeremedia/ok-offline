<template>
  <section id="search-section" class="view">
    <div class="search-header">
      <h2>Search Everything</h2>
      <input 
        v-model="searchQuery"
        @input="performSearch"
        type="text"
        placeholder="Search camps, art, events..."
        class="search-input"
        ref="searchInput"
      >
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
      <div v-if="loading" class="loading">Searching...</div>
      <div v-else-if="!searchQuery" class="hint">
        Start typing to search across all camps, art installations, and events
      </div>
      <div v-else-if="results.length === 0" class="no-results">
        No results found for "{{ searchQuery }}"
      </div>
      <div v-else class="results-list">
        <div class="results-count">{{ results.length }} results found</div>
        
        <div v-for="result in paginatedResults" :key="`${result.type}-${result.item.uid}`" class="result-item">
          <div class="result-header">
            <span class="result-type">{{ typeIcons[result.type] }}</span>
            <h3 @click="navigateToItem(result)">{{ getItemName(result.item) }}</h3>
            <button 
              @click="toggleFavorite(result)"
              class="favorite-btn"
              :class="{ active: result.isFavorited }"
            >
              {{ result.isFavorited ? '★' : '☆' }}
            </button>
          </div>
          <div class="result-location">{{ getItemLocation(result.item) }}</div>
          <div v-if="result.item.description" class="result-description">
            {{ result.item.description.substring(0, 150) }}...
          </div>
          <div v-if="result.item.event_type" class="result-event-type">
            {{ result.item.event_type.label }}
          </div>
        </div>
        
        <div v-if="hasMore" class="load-more">
          <button @click="loadMore" class="load-more-btn">Load More</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getFromCache } from '../services/storage'
import { isFavorite, toggleFavorite as toggleFav } from '../services/favorites'
import { getItemName, getItemLocation } from '../utils'

const router = useRouter()
const route = useRoute()
const searchInput = ref(null)
const searchQuery = ref('')
const loading = ref(false)
const results = ref([])
const pageSize = 20
const currentPage = ref(1)

const includeTypes = ref({
  camps: true,
  art: true,
  events: true
})

const typeIcons = {
  camp: '🏠',
  art: '🎨',
  event: '🎉'
}

const year = computed(() => route.params.year || localStorage.getItem('selectedYear') || '2025')

const paginatedResults = computed(() => {
  const end = currentPage.value * pageSize
  return results.value.slice(0, end)
})

const hasMore = computed(() => {
  return results.value.length > currentPage.value * pageSize
})

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }
  
  loading.value = true
  currentPage.value = 1
  
  try {
    const query = searchQuery.value.toLowerCase()
    const searchResults = []
    
    // Search camps
    if (includeTypes.value.camps) {
      const camps = await getFromCache('camp', year.value)
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
    if (includeTypes.value.art) {
      const art = await getFromCache('art', year.value)
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
    if (includeTypes.value.events) {
      const events = await getFromCache('event', year.value)
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
    
    results.value = searchResults
  } catch (err) {
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}

const matchesSearch = (item, query) => {
  const name = getItemName(item).toLowerCase()
  const location = getItemLocation(item).toLowerCase()
  const description = (item.description || '').toLowerCase()
  const hometown = (item.hometown || '').toLowerCase()
  
  return name.includes(query) || 
         location.includes(query) || 
         description.includes(query) ||
         hometown.includes(query)
}

const navigateToItem = (result) => {
  router.push(`/${year.value}/${result.type}s/${result.item.uid}`)
}

const toggleFavorite = (result) => {
  result.isFavorited = toggleFav(result.type, result.item.uid)
}

const loadMore = () => {
  currentPage.value++
}

onMounted(() => {
  searchInput.value?.focus()
  
  // Check if there's a search query in the URL
  if (route.query.q) {
    searchQuery.value = route.query.q
    performSearch()
  }
})
</script>

<style scoped>
#search-section {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.search-header {
  margin-bottom: 1rem;
}

.search-header h2 {
  margin-bottom: 1rem;
  color: #ccc;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
}

.search-input:focus {
  outline: none;
  border-color: #8B0000;
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
}

.filter-checkbox:hover {
  color: #fff;
}

.filter-checkbox input {
  cursor: pointer;
}

.loading, .hint, .no-results {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.results-count {
  color: #999;
  margin-bottom: 1rem;
}

.result-item {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: background 0.2s;
}

.result-item:hover {
  background: #333;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.result-type {
  font-size: 1.2rem;
}

.result-header h3 {
  flex: 1;
  margin: 0;
  color: #fff;
  cursor: pointer;
  font-size: 1.1rem;
}

.result-header h3:hover {
  color: #8B0000;
}

.result-location {
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.result-description {
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
}

.result-event-type {
  color: #8B0000;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-style: italic;
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

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more-btn {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.load-more-btn:hover {
  background: #a00;
}
</style>