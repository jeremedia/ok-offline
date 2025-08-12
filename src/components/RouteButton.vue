<template>
  <div class="route-button-container">
    <!-- Route Button -->
    <BaseButton
      v-if="!hasRouteToThisItem"
      @click="handleRouteClick"
      :disabled="!canCreateRoute"
      :variant="canCreateRoute ? 'secondary' : 'ghost'"
      :size="size"
      :title="routeButtonTitle"
      class="route-btn"
    >
      <span class="route-btn-content">
        🗺️ {{ compact ? '' : 'Route' }}
      </span>
    </BaseButton>

    <!-- Active Route Display -->
    <div v-else class="route-active" @click="handleRouteClick">
      <div class="route-info">
        <span class="route-icon">{{ routeModeInfo.icon }}</span>
        <span class="route-time">{{ routeDetails?.currentTime }}</span>
        <span v-if="!compact" class="route-distance">{{ routeDetails?.distance }}</span>
      </div>
      <BaseButton 
        @click.stop="clearRoute"
        variant="ghost"
        size="sm"
        class="clear-route-btn"
        title="Clear route"
      >
        ✕
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeolocation } from '../composables/useGeolocation'
import { useRouting } from '../composables/useRouting'
import { getItemLocation } from '../utils'
import BaseButton from './ui/BaseButton.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  size: {
    type: String,
    default: 'sm',
    validator: value => ['sm', 'md', 'lg'].includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  },
  navigateToMap: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['route-created', 'route-cleared'])

const router = useRouter()
const { userLocation } = useGeolocation()
const { 
  createRoute, 
  clearRoute: clearCurrentRoute, 
  hasRouteToItem, 
  canRoute,
  routeModeInfo,
  routeDetails
} = useRouting()

// Computed properties
const canCreateRoute = computed(() => {
  return canRoute(userLocation.value) && getItemLocation(props.item)
})

const hasRouteToThisItem = computed(() => {
  return hasRouteToItem(props.item)
})

const routeButtonTitle = computed(() => {
  if (!userLocation.value) {
    return 'Enable location to create routes'
  }
  if (!getItemLocation(props.item)) {
    return 'Location not available for routing'
  }
  return `Create route to ${props.item.name || props.item.title}`
})

// Methods
const handleRouteClick = async () => {
  if (hasRouteToThisItem.value) {
    // If we already have a route to this item, navigate to map view
    if (props.navigateToMap) {
      await navigateToMapWithRoute()
    }
    return
  }

  if (!canCreateRoute.value) {
    console.warn('Cannot create route: missing user location or item location')
    return
  }

  // Create the route
  const route = createRoute(userLocation.value, props.item, getItemLocation)
  
  if (route) {
    emit('route-created', { item: props.item, route })
    
    // Navigate to map view if requested (from ListView)
    if (props.navigateToMap) {
      await navigateToMapWithRoute()
    }
  }
}

const clearRoute = () => {
  clearCurrentRoute()
  emit('route-cleared', { item: props.item })
}

const navigateToMapWithRoute = async () => {
  // Determine the correct map route based on item type
  const routeName = props.item.event_type ? 'events-map' : 
                   props.item.artist ? 'art-map' : 'camps-map'
  
  try {
    await router.push({ 
      name: routeName, 
      params: { year: new Date().getFullYear() },
      query: { route: props.item.uid }
    })
  } catch (error) {
    console.error('Failed to navigate to map:', error)
  }
}
</script>

<style scoped>
.route-button-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.route-btn {
  min-width: fit-content;
}

.route-btn-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.route-active {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-success-alpha-20);
  border: 1px solid var(--color-success-alpha-40);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.route-active:hover {
  background: var(--color-success-alpha-30);
  border-color: var(--color-success-alpha-60);
}

.route-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.route-icon {
  font-size: 0.875rem;
}

.route-time {
  color: var(--color-success);
  font-weight: 600;
}

.route-distance {
  color: var(--color-text-muted);
  font-size: 0.688rem;
}

.clear-route-btn {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  opacity: 0.7;
}

.clear-route-btn:hover {
  opacity: 1;
  background: var(--color-error-alpha-20);
  color: var(--color-error);
}

/* Compact mode adjustments */
.route-button-container:has(.route-btn) .route-btn-content {
  font-size: 1rem;
}

/* Mobile optimizations */
@media (max-width: 600px) {
  .route-info {
    font-size: 0.688rem;
  }
  
  .route-distance {
    display: none; /* Hide distance on very small screens */
  }
}
</style>