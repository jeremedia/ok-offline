<template>
  <div class="infrastructure-view">
    <!-- Header with search -->
    <div class="header-section">
      <h2 class="view-title">Infrastructure</h2>
      
      <!-- Poetic introduction -->
      <div class="infrastructure-intro" :class="{ collapsed: isIntroCollapsed }">
        <div class="intro-header" @click="toggleIntro">
          <h4>Essential services and structures that make Black Rock City possible</h4>
          <button 
            class="collapse-btn"
            :aria-label="isIntroCollapsed ? 'Expand introduction' : 'Collapse introduction'"
          >
            {{ isIntroCollapsed ? '▼' : '▲' }}
          </button>
        </div>
        
        <div v-show="!isIntroCollapsed" class="intro-content">
          <p>Step into the dust and you step into a living experiment—part carnival, part civic lab—where wooden effigies and desert silence conspire to wake us up. At the center stands the Man, a beacon that asks nothing more than your curiosity, while the Temple offers room for all the stories we carry but cannot keep. Around them, an invisible lattice of care takes shape. Rangers ride the city's heartbeat, medics carry cool shade in their hands, and the Department of Public Works stitches roads and rebar into a map we can follow back to ourselves.</p>
          
          <p>This network is built by volunteers who trade comfort for possibility. It keeps the ice melting slowly, the sound camps thundering after midnight, and the night sky clear enough to remind you why we bother with stars. It is not infrastructure in the municipal sense. It is a promise we make to one another: that radical self‑expression works best when everyone has water, shelter, and a way home.</p>
          
          <p>So wander. Get lost. Let the city hold you for a while. Then lend a hand. Every stake driven, every radio check, every art car's taillight is part of the same quiet collaboration that turns empty playa into a place we call home for one improbable week each year.</p>
        </div>
      </div>
      
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
const isIntroCollapsed = ref(true)

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
  window.scrollTo(0, 0)
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

const toggleIntro = () => {
  isIntroCollapsed.value = !isIntroCollapsed.value
  localStorage.setItem('infrastructureIntroCollapsed', isIntroCollapsed.value.toString())
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
  
  // Load collapsed state
  const savedCollapsed = localStorage.getItem('infrastructureIntroCollapsed')
  if (savedCollapsed !== null) {
    isIntroCollapsed.value = savedCollapsed === 'true'
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


.infrastructure-intro {
  margin: 2rem auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid #444;
  max-width: 800px;
  overflow: hidden;
}

.infrastructure-intro.collapsed .intro-header {
  border-radius: 8px;
  border-bottom: none;
}

.intro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #444;
  cursor: pointer;
  transition: background 0.2s ease;
}

.intro-header:hover {
  background: rgba(0, 0, 0, 0.4);
}

.intro-header h4 {
  margin: 0;
  color: var(--color-gold);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.3;
}

.intro-header .collapse-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  margin-left: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.intro-header .collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.intro-content {
  padding: 1.5rem;
}

.intro-content p {
  color: #ddd;
  line-height: 1.8;
  margin-bottom: 1rem;
  text-align: justify;
  font-size: 0.95rem;
}

.intro-content p:first-child {
margin-top: 0;
}

.intro-content p:last-child {
  margin-bottom: 0;
}

.search-controls {
  max-width: 500px;
  margin: 2rem auto 0;
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
    margin-bottom: 1rem;
  }
  
  .infrastructure-intro {
    margin: 1rem 0;
  }
  
  .intro-header {
    padding: 0.625rem 0.75rem;
  }
  
  .intro-header h4 {
    font-size: 0.75rem;
    padding-right: 0.5rem;
  }
  
  .intro-header .collapse-btn {
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    flex-shrink: 0;
  }
  
  .intro-content {
    padding: 1rem;
  }
  
  .intro-content p {
    font-size: 0.9rem;
    text-align: left;
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