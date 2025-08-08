<template>
  <div class="tab-content features-content">
    <h2>Features</h2>
    
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <p>Loading features...</p>
    </div>
    
    <!-- Features content -->
    <template v-else>
    
    <!-- Marquee Feature -->
    <div class="marquee-feature" v-if="featuresData?.marquee">
      <div class="marquee-badge">NEW</div>
      <h3>{{ featuresData.marquee.icon }} {{ featuresData.marquee.title }}</h3>
      <p class="marquee-description">{{ featuresData.marquee.description }}</p>
      <div class="marquee-meta">
        <span class="version-tag">v{{ featuresData.marquee.version }}</span>
      </div>
    </div>

    <!-- View Mode Toggle -->
    <div class="view-controls">
      <ButtonGroup direction="horizontal">
        <BaseButton 
          :variant="viewMode === 'category' ? 'primary' : 'secondary'"
          size="sm"
          @click="viewMode = 'category'"
        >
          BY CATEGORY
        </BaseButton>
        <BaseButton 
          :variant="viewMode === 'all' ? 'primary' : 'secondary'"
          size="sm"
          @click="viewMode = 'all'"
        >
          ALL FEATURES
        </BaseButton>
      </ButtonGroup>
    </div>

    <!-- Category View -->
    <div v-if="viewMode === 'category'" class="category-view">
      <div 
        v-for="category in sortedCategories" 
        :key="category.id"
        class="category-section"
      >
        <div 
          class="category-header"
          @click="toggleCategory(category.id)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <h3>{{ category.name }}</h3>
          <span class="category-count">{{ getCategoryFeatures(category.id).length }}</span>
          <span class="expand-icon">{{ expandedCategories[category.id] ? '−' : '+' }}</span>
        </div>
        
        <div v-if="expandedCategories[category.id]" class="category-features">
          <div 
            v-for="feature in getCategoryFeatures(category.id)" 
            :key="feature.title"
            class="feature-card"
            @click="selectedFeature = feature"
          >
            <div class="feature-header">
              <span class="feature-icon">{{ feature.icon }}</span>
              <h4>{{ feature.title }}</h4>
              <span class="version-tag">v{{ feature.version }}</span>
            </div>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- All Features View -->
    <div v-else class="all-features-view">
      <div class="features-grid">
        <div 
          v-for="feature in featuresData?.features || []" 
          :key="feature.title"
          class="feature-card"
          @click="selectedFeature = feature"
        >
          <div class="feature-header">
            <span class="feature-icon">{{ feature.icon }}</span>
            <h4>{{ feature.title }}</h4>
            <span class="version-tag">v{{ feature.version }}</span>
          </div>
          <p class="feature-description">{{ feature.description }}</p>
          <div class="feature-category">
            {{ getCategoryName(feature.category) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Detail Modal -->
    <div v-if="selectedFeature" class="feature-modal" @click="selectedFeature = null">
      <div class="feature-detail" @click.stop>
        <button class="close-button" @click="selectedFeature = null">×</button>
        <div class="detail-header">
          <span class="detail-icon">{{ selectedFeature.icon }}</span>
          <h3>{{ selectedFeature.title }}</h3>
        </div>
        <p class="detail-description">{{ selectedFeature.description }}</p>
        <div class="detail-features">
          <h4>Features:</h4>
          <ul>
            <li v-for="detail in selectedFeature.details" :key="detail">
              {{ detail }}
            </li>
          </ul>
        </div>
        <div class="detail-meta">
          <span class="version-tag">Introduced in v{{ selectedFeature.version }}</span>
          <span class="category-tag">{{ getCategoryName(selectedFeature.category) }}</span>
        </div>
      </div>
    </div>
    
    </template>

    <!-- Keyboard Shortcuts always visible -->
    <div class="keyboard-shortcuts">
      <h3>⌨️ Keyboard Shortcuts</h3>
      <table>
        <tbody>
          <tr><td><kbd>1</kbd></td><td>Go to Map</td></tr>
          <tr><td><kbd>2</kbd></td><td>Go to Camps</td></tr>
          <tr><td><kbd>3</kbd></td><td>Go to Art</td></tr>
          <tr><td><kbd>4</kbd></td><td>Go to Events</td></tr>
          <tr><td><kbd>5</kbd></td><td>Go to Search</td></tr>
          <tr><td><kbd>6</kbd></td><td>Go to Schedule</td></tr>
          <tr><td><kbd>7</kbd></td><td>Go to Dust Forecast</td></tr>
          <tr><td><kbd>F</kbd></td><td>Toggle Favorites</td></tr>
          <tr><td><kbd>L</kbd></td><td>Toggle Layers (Map)</td></tr>
          <tr><td><kbd>/</kbd></td><td>Show Shortcuts</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'

// State for features data
const featuresData = ref(null)
const loading = ref(true)

// State
const viewMode = ref('category')
const expandedCategories = ref({})
const selectedFeature = ref(null)

// Computed
const sortedCategories = computed(() => {
  if (!featuresData.value?.categories) return []
  return Object.entries(featuresData.value.categories)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => a.order - b.order)
})

// Methods
const getCategoryFeatures = (categoryId) => {
  if (!featuresData.value?.features) return []
  return featuresData.value.features.filter(f => f.category === categoryId)
}

const getCategoryName = (categoryId) => {
  return featuresData.value?.categories?.[categoryId]?.name || categoryId
}

const toggleCategory = (categoryId) => {
  expandedCategories.value[categoryId] = !expandedCategories.value[categoryId]
}

// Initialize with first 3 categories expanded
onMounted(async () => {
  // Load features data
  try {
    const response = await fetch('/data/features.json')
    featuresData.value = await response.json()
    
    // Expand first 3 categories
    sortedCategories.value.slice(0, 3).forEach(cat => {
      expandedCategories.value[cat.id] = true
    })
  } catch (error) {
    console.error('Failed to load features data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Marquee Feature */
.marquee-feature {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: var(--color-text-inverse);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.marquee-feature::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { transform: translate(50%, 50%) rotate(0deg); }
  50% { transform: translate(50%, 50%) rotate(180deg); }
}

.marquee-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-accent);
  color: var(--color-bg-base);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.marquee-feature h3 {
  font-size: 1.75rem;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.marquee-description {
  font-size: 1.125rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
  opacity: 0.95;
}

.marquee-meta {
  display: flex;
  gap: 1rem;
}

/* View Controls */
.view-controls {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

/* Category View */
.category-section {
  margin-bottom: 1rem;
}

.category-header {
  background: var(--color-bg-elevated);
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border-medium);
}

.category-header:hover {
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.category-header h3 {
  flex: 1;
  margin: 0;
  font-size: 1.125rem;
}

.category-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.category-count {
  background: var(--color-bg-input);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.expand-icon {
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  width: 1.5rem;
  text-align: center;
}

.category-features {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.75rem;
}

/* Feature Cards */
.feature-card {
  background: var(--color-bg-elevated);
  padding: 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border-light);
}

.feature-card:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-medium);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-header h4 {
  flex: 1;
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.feature-description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.version-tag {
  background: var(--color-bg-input);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Berkeley Mono', monospace;
  color: var(--color-text-muted);
}

/* All Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.all-features-view .feature-category {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Feature Detail Modal */
.feature-modal {
  position: fixed;
  inset: 0;
  background: var(--color-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.feature-detail {
  background: var(--color-bg-elevated);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 40px var(--color-shadow-heavy);
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-muted);
  cursor: pointer;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-icon {
  font-size: 3rem;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.75rem;
}

.detail-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.detail-features h4 {
  margin: 0 0 0.75rem 0;
  color: var(--color-text-primary);
}

.detail-features ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.detail-features li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.detail-features li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--color-success);
  font-weight: bold;
}

.detail-meta {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-light);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.category-tag {
  background: var(--color-primary-alpha-20);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Keyboard Shortcuts */
.keyboard-shortcuts {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border-medium);
}

.keyboard-shortcuts table {
  width: 100%;
  border-collapse: collapse;
}

.keyboard-shortcuts td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.keyboard-shortcuts kbd {
  background: var(--color-bg-input);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
  border: 1px solid var(--color-border-medium);
  box-shadow: 0 1px 2px var(--color-shadow-light);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

/* Mobile Adjustments */
body.mobile-device .features-grid {
  grid-template-columns: 1fr;
}

body.mobile-device .feature-detail {
  padding: 1.5rem;
}

body.mobile-device .marquee-feature {
  padding: 1.5rem;
}

body.mobile-device .detail-icon {
  font-size: 2rem;
}

body.mobile-device .detail-header h3 {
  font-size: 1.5rem;
}
</style>