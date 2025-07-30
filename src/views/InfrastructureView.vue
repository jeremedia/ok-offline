<template>
  <div class="infrastructure-view">
    <!-- Header with search -->
    <div class="header-section">
      <h2 class="view-title">Infrastructure</h2>
      <p class="view-subtitle">Essential services and structures that make Black Rock City possible</p>
      
      <div class="search-controls">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search infrastructure..."
          class="search-input"
          @input="handleSearch"
        >
      </div>
    </div>

    <!-- Category filters -->
    <div class="category-filters">
      <button
        v-for="category in categories"
        :key="category.name"
        @click="toggleCategory(category.name)"
        :class="['category-btn', { active: selectedCategory === category.name }]"
      >
        {{ category.displayName }}
        <span class="count">({{ category.count }})</span>
      </button>
      <button
        @click="selectedCategory = null"
        :class="['category-btn', 'all-btn', { active: !selectedCategory }]"
      >
        All
        <span class="count">({{ totalCount }})</span>
      </button>
    </div>

    <!-- Infrastructure grid -->
    <div class="infrastructure-grid" v-if="filteredItems.length > 0">
      <InfrastructureCard
        v-for="item in sortedItems"
        :key="item.id"
        :item="item"
        :distance="item.distance"
        @click="navigateToDetail(item.id)"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <p>No infrastructure found matching your search.</p>
    </div>

    <!-- Distance sort option -->
    <div class="sort-controls" v-if="hasLocation">
      <label class="sort-option">
        <input
          type="checkbox"
          v-model="sortByDistance"
          @change="updateSort"
        >
        Sort by distance
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InfrastructureCard from '../components/infrastructure/InfrastructureCard.vue'
import { 
  getAllInfrastructure, 
  getCategories, 
  searchInfrastructure,
  sortByDistance as sortItemsByDistance
} from '../services/infrastructure'

const props = defineProps({
  year: {
    type: String,
    required: true
  }
})

const router = useRouter()

// State
const searchQuery = ref('')
const selectedCategory = ref(null)
const sortByDistance = ref(false)
const userLocation = ref(null)
const allItems = ref([])
const categories = ref([])

// Check for user location
const hasLocation = computed(() => {
  const coords = localStorage.getItem('userCoordinates')
  return coords !== null
})

// Total count
const totalCount = computed(() => allItems.value.length)

// Filtered items based on search and category
const filteredItems = computed(() => {
  let items = searchQuery.value 
    ? searchInfrastructure(searchQuery.value)
    : allItems.value
    
  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }
  
  return items
})

// Sorted items
const sortedItems = computed(() => {
  if (sortByDistance.value && userLocation.value) {
    return sortItemsByDistance(filteredItems.value, userLocation.value)
  }
  return filteredItems.value
})

// Methods
const handleSearch = () => {
  // Search is reactive through computed property
}

const toggleCategory = (category) => {
  selectedCategory.value = selectedCategory.value === category ? null : category
}

const navigateToDetail = (id) => {
  router.push(`/${props.year}/infrastructure/${id}`)
}

const updateSort = () => {
  if (sortByDistance.value && hasLocation.value) {
    const coords = localStorage.getItem('userCoordinates')
    if (coords) {
      userLocation.value = JSON.parse(coords)
    }
  }
}

// Load data on mount
onMounted(() => {
  allItems.value = getAllInfrastructure()
  categories.value = getCategories()
  
  // Check for user location
  if (hasLocation.value) {
    const coords = localStorage.getItem('userCoordinates')
    userLocation.value = JSON.parse(coords)
  }
})
</script>

<style scoped>
.infrastructure-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.view-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #fff;
}

.view-subtitle {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.search-controls {
  max-width: 500px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
}

.search-input:focus {
  outline: none;
  border-color: #8B0000;
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.category-btn {
  padding: 0.5rem 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background: #333;
  border-color: #666;
}

.category-btn.active {
  background: #8B0000;
  border-color: #8B0000;
  color: #fff;
}

.category-btn .count {
  opacity: 0.7;
  font-size: 0.9em;
  margin-left: 0.25rem;
}

.infrastructure-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.sort-controls {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: #2a2a2a;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #444;
}

.sort-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  cursor: pointer;
}

.sort-option input {
  cursor: pointer;
}

/* Mobile styles */
@media (max-width: 600px) {
  .infrastructure-view {
    padding: 0.5rem;
  }
  
  .view-title {
    font-size: 1.5rem;
  }
  
  .infrastructure-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .sort-controls {
    bottom: 70px;
    right: 10px;
    padding: 0.75rem;
  }
}
</style>