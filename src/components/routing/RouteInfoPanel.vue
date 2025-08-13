<template>
  <div class="route-info-panel" :class="{ 'route-info-panel--expanded': isExpanded }">
    <!-- Route Header with Primary Information -->
    <div class="route-header" @click="toggleExpanded">
      <div class="route-header-main">
        <!-- Route Type Badge (Primary) -->
        <div class="route-type-badge" :class="`route-type-badge--${routeTypeClass}`">
          <span class="route-type-icon">{{ routeTypeIcon }}</span>
          <span class="route-type-label">{{ routeTypeLabel }}</span>
          <span v-if="efficiencyGain" class="efficiency-gain">{{ efficiencyGain }}%</span>
        </div>
        
        <!-- Route Summary (Secondary) -->
        <div class="route-summary">
          <div class="route-distance">{{ route.distanceText }}</div>
          <div class="route-time">{{ currentTravelTime }}</div>
        </div>
      </div>
      
      <!-- Expansion Toggle -->
      <div class="route-expand-toggle">
        <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
      </div>
    </div>

    <!-- Expanded Content (Progressive Disclosure) -->
    <transition name="route-expand">
      <div v-if="isExpanded" class="route-details">
        
        <!-- Travel Mode Selector -->
        <div class="travel-mode-selector">
          <div class="travel-modes">
            <BaseButton
              @click="$emit('mode-changed', 'walking')"
              :variant="currentMode === 'walking' ? 'primary' : 'ghost'"
              size="sm"
              class="mode-btn"
            >
              🚶 Walking
            </BaseButton>
            <BaseButton
              @click="$emit('mode-changed', 'biking')"
              :variant="currentMode === 'biking' ? 'primary' : 'ghost'"
              size="sm"
              class="mode-btn"
            >
              🚴 Biking
            </BaseButton>
          </div>
        </div>

        <!-- Revolutionary Hybrid Segments (Three-Segment Breakdown) -->
        <div v-if="isHybridRoute" class="route-segments">
          <h4 class="section-title">Revolutionary Hybrid Route</h4>
          
          <div class="segments-list">
            <div 
              v-for="(segment, index) in enhancedSegments" 
              :key="segment.id"
              class="segment"
              :class="`segment--${segment.type.replace('_', '-')}`"
            >
              <div class="segment-header">
                <div class="segment-indicator" :style="{ backgroundColor: segment.style.color }"></div>
                <div class="segment-title">
                  {{ getSegmentTitle(segment.type) }}
                  <span class="segment-subtitle">{{ getSegmentSubtitle(segment) }}</span>
                </div>
                <div class="segment-stats">
                  <span class="segment-distance">{{ Math.round(segment.distance) }}ft</span>
                  <span class="segment-duration">{{ segment.duration }}min</span>
                </div>
              </div>
              
              <div class="segment-description">
                {{ segment.instructions }}
              </div>
              
              <!-- Cultural Context for Playa Crossing -->
              <div v-if="segment.type === 'playa_crossing' && landmarks.length > 0" class="segment-landmarks">
                <span class="landmarks-label">Past:</span>
                <span class="landmarks-list">{{ landmarks.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Turn-by-Turn Directions -->
        <div v-if="hasDirections" class="route-directions">
          <h4 class="section-title">Turn-by-Turn Directions</h4>
          
          <div class="directions-list">
            <div 
              v-for="(direction, index) in route.enhancedRoute.directions" 
              :key="index"
              class="direction-step"
            >
              <div class="direction-number">{{ index + 1 }}</div>
              <div class="direction-content">
                <div class="direction-instruction">{{ direction.instruction }}</div>
                <div class="direction-meta">
                  <span class="direction-distance">{{ direction.distance }}ft</span>
                  <span class="direction-duration">{{ direction.duration }}min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Route Comparison (if available) -->
        <div v-if="showComparison" class="route-comparison">
          <h4 class="section-title">Route Efficiency</h4>
          
          <div class="comparison-stats">
            <div class="comparison-item">
              <span class="comparison-label">Hybrid Route:</span>
              <span class="comparison-value comparison-value--hybrid">
                {{ route.distanceText }} • {{ currentTravelTime }}
              </span>
            </div>
            <div class="comparison-item">
              <span class="comparison-label">Street-Only Route:</span>
              <span class="comparison-value comparison-value--street">
                {{ estimatedStreetRoute }}
              </span>
            </div>
            <div class="comparison-savings">
              <strong>Time Saved: {{ timeSavings }}</strong>
            </div>
          </div>
        </div>

        <!-- Route Actions -->
        <div class="route-actions">
          <BaseButton
            @click="$emit('start-navigation')"
            variant="primary"
            size="md"
            fullWidth
            class="start-nav-btn"
          >
            🧭 Start Navigation
          </BaseButton>
          
          <div class="secondary-actions">
            <BaseButton
              @click="$emit('share-route')"
              variant="ghost"
              size="sm"
              class="action-btn"
            >
              📤 Share
            </BaseButton>
            <BaseButton
              @click="$emit('save-route')"
              variant="ghost"
              size="sm"
              class="action-btn"
            >
              💾 Save
            </BaseButton>
            <BaseButton
              @click="$emit('clear-route')"
              variant="ghost"
              size="sm"
              class="action-btn"
            >
              ✕ Clear
            </BaseButton>
          </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  route: {
    type: Object,
    required: true
  },
  currentMode: {
    type: String,
    default: 'walking',
    validator: value => ['walking', 'biking'].includes(value)
  },
  startExpanded: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'mode-changed',
  'start-navigation', 
  'share-route',
  'save-route',
  'clear-route'
])

// Component state
const isExpanded = ref(props.startExpanded)

// Computed properties following UI hierarchy principles
const isHybridRoute = computed(() => 
  props.route.enhancedRoute?.routeType === 'hybrid' && 
  props.route.enhancedRoute?.segments?.length > 1
)

const routeTypeClass = computed(() => {
  if (isHybridRoute.value) return 'hybrid'
  if (props.route.enhancedRoute?.routeType === 'street_following') return 'street'
  return 'direct'
})

const routeTypeIcon = computed(() => {
  switch (routeTypeClass.value) {
    case 'hybrid': return '🔥'
    case 'street': return '🛣️'
    default: return '➡️'
  }
})

const routeTypeLabel = computed(() => {
  switch (routeTypeClass.value) {
    case 'hybrid': return 'Revolutionary Hybrid'
    case 'street': return 'Street Navigation'
    default: return 'Direct Route'
  }
})

const efficiencyGain = computed(() => {
  if (isHybridRoute.value && props.route.enhancedRoute?.summary?.efficiency) {
    const efficiency = props.route.enhancedRoute.summary.efficiency
    return Math.round(efficiency * 100)
  }
  return null
})

const currentTravelTime = computed(() => {
  const times = props.route.travelTimes
  return props.currentMode === 'walking' 
    ? times.walking.formatted 
    : times.biking.formatted
})

const enhancedSegments = computed(() => {
  if (!isHybridRoute.value) return []
  
  return props.route.enhancedRoute.segments.map((segment, index) => ({
    ...segment,
    id: `segment-${index}`,
    style: getSegmentStyle(segment.type)
  }))
})

const landmarks = computed(() => {
  return props.route.enhancedRoute?.landmarks || []
})

const hasDirections = computed(() => 
  props.route.enhancedRoute?.directions && 
  props.route.enhancedRoute.directions.length > 0
)

const showComparison = computed(() => 
  isHybridRoute.value && 
  props.route.enhancedRoute?.summary?.timeSavings
)

const estimatedStreetRoute = computed(() => {
  if (!showComparison.value) return ''
  
  const currentTime = props.currentMode === 'walking' 
    ? props.route.travelTimes.walking.minutes 
    : props.route.travelTimes.biking.minutes
  
  const streetTime = Math.round(currentTime / (1 - props.route.enhancedRoute.summary.timeSavings))
  return `~${Math.round(props.route.distance.feet * 1.3)}ft • ${streetTime}min`
})

const timeSavings = computed(() => {
  if (!showComparison.value) return ''
  
  const savings = Math.round(props.route.enhancedRoute.summary.timeSavings * 100)
  return `${savings}% faster`
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  
  // Save preference
  localStorage.setItem('routeInfoExpanded', JSON.stringify(isExpanded.value))
}

const getSegmentTitle = (type) => {
  switch (type) {
    case 'urban_navigation': return 'Street Navigation'
    case 'playa_crossing': return 'Playa Crossing'
    default: return 'Route Segment'
  }
}

const getSegmentSubtitle = (segment) => {
  if (segment.subType === 'urban_exit') return '(to city edge)'
  if (segment.subType === 'urban_entry') return '(from city edge)'
  if (segment.type === 'playa_crossing') return '(revolutionary shortcut)'
  return ''
}

const getSegmentStyle = (type) => {
  switch (type) {
    case 'urban_navigation':
      return { color: '#D32F2F' } // Red for urban
    case 'playa_crossing':
      return { color: '#2196F3' } // Blue for playa
    default:
      return { color: '#FFC107' } // Yellow for other
  }
}

// Load saved expansion state
onMounted(() => {
  const saved = localStorage.getItem('routeInfoExpanded')
  if (saved !== null) {
    isExpanded.value = JSON.parse(saved)
  }
})
</script>

<style scoped>
/* Following UI/UX Guidelines: Theme-aware, mobile-first, progressive disclosure */

.route-info-panel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.route-info-panel--expanded {
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

/* Route Header - Primary Information */
.route-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  background: var(--color-bg-header);
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  min-height: 44px; /* Mobile touch target */
}

.route-header:hover {
  background: var(--color-bg-hover);
  border-bottom-color: var(--color-border-light);
}

.route-header-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Route Type Badge - Primary Element */
.route-type-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  white-space: nowrap;
}

.route-type-badge--hybrid {
  background: linear-gradient(135deg, #FF5722 0%, #2196F3 100%);
  color: white;
}

.route-type-badge--street {
  background: var(--color-warning-alpha-20);
  color: var(--color-warning);
  border: 1px solid var(--color-warning-alpha-40);
}

.route-type-badge--direct {
  background: var(--color-info-alpha-20);
  color: var(--color-info);
  border: 1px solid var(--color-info-alpha-40);
}

.efficiency-gain {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.125rem 0.375rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Route Summary - Secondary Information */
.route-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.route-distance {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.route-time {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

/* Expansion Toggle */
.route-expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.expand-icon {
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

/* Expanded Content - Progressive Disclosure */
.route-expand-enter-active,
.route-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.route-expand-enter-from,
.route-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.route-expand-enter-to,
.route-expand-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.route-details {
  padding: 0 1rem 1rem;
  background: var(--color-bg-base);
}

/* Travel Mode Selector */
.travel-mode-selector {
  margin-bottom: 1.5rem;
}

.travel-modes {
  display: flex;
  gap: 0.5rem;
}

.mode-btn {
  flex: 1;
  min-height: 44px; /* Mobile touch target */
}

/* Section Titles */
.section-title {
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

/* Route Segments - Three-Segment Breakdown */
.route-segments {
  margin-bottom: 1.5rem;
}

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.segment {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  padding: 0.75rem;
}

.segment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.segment-indicator {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  flex-shrink: 0;
}

.segment-title {
  flex: 1;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.segment-subtitle {
  color: var(--color-text-muted);
  font-weight: normal;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.segment-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
}

.segment-distance,
.segment-duration {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.segment-distance {
  font-weight: 600;
}

.segment-description {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin-left: 1.75rem;
}

.segment-landmarks {
  margin-top: 0.5rem;
  margin-left: 1.75rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.landmarks-label {
  font-weight: 500;
  color: var(--color-accent);
}

/* Turn-by-Turn Directions */
.route-directions {
  margin-bottom: 1.5rem;
}

.directions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.direction-step {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--color-bg-elevated);
  border-radius: 6px;
}

.direction-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.direction-content {
  flex: 1;
}

.direction-instruction {
  color: var(--color-text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}

.direction-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Route Comparison */
.route-comparison {
  margin-bottom: 1.5rem;
}

.comparison-stats {
  background: var(--color-bg-elevated);
  border-radius: 6px;
  padding: 0.75rem;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.comparison-item:last-child {
  border-bottom: none;
}

.comparison-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.comparison-value {
  font-size: 0.875rem;
  font-weight: 500;
}

.comparison-value--hybrid {
  color: var(--color-success);
}

.comparison-value--street {
  color: var(--color-text-muted);
}

.comparison-savings {
  text-align: center;
  padding-top: 0.5rem;
  color: var(--color-success);
  font-size: 0.9rem;
}

/* Route Actions */
.route-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.start-nav-btn {
  min-height: 44px; /* Mobile touch target */
  font-weight: 600;
}

.secondary-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  min-height: 44px; /* Mobile touch target */
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .route-header {
    padding: 0.75rem;
  }
  
  .route-details {
    padding: 0 0.75rem 0.75rem;
  }
  
  .route-type-badge {
    font-size: 0.8rem;
    padding: 0.25rem 0.5rem;
  }
  
  .route-distance {
    font-size: 1rem;
  }
  
  .segment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .segment-stats {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
  
  .secondary-actions {
    flex-direction: column;
  }
}

/* Theme-specific adjustments */
body.mobile-device .route-header,
body.mobile-device .mode-btn,
body.mobile-device .start-nav-btn,
body.mobile-device .action-btn {
  min-height: 48px; /* Larger touch targets on mobile */
}
</style>