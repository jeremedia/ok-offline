<template>
  <header>
    <div class="header-row">
      <!-- Desktop Navigation -->
      <div class="nav-section desktop-only">
        <div class="year-selector-group">
          <select 
            id="year-selector" 
            :value="selectedYear" 
            @change="$emit('update:selectedYear', $event.target.value)"
            class="unified-select"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <nav class="main-nav">
          <BaseButton 
            v-for="item in navItems" 
            :key="item.route"
            @click="navigate(item.route)" 
            variant="ghost"
            :active="isActive(item.route)"
            :uppercase="true"
            class="nav-btn"
          >
            {{ item.label }}
          </BaseButton>
        </nav>
      </div>
      
      <!-- App Title -->
      <div class="app-title-section">
        <h1 @click="$emit('navigate', 'settings')" class="app-title">
          OK-OFFLINE
          <span v-if="isDev" class="dev-indicator">DEV</span>
        </h1>
        <BaseButton 
          @click="$emit('navigate', 'settings/data_sync')"
          variant="ghost"
          :class="['status-dot', { offline: !isOnline }]"
          :title="isOnline ? 'Online - Click for data sync' : 'Offline - Click for data sync'"
          aria-label="Connection status and data sync"
        />
      </div>
      
      <!-- Mobile Actions -->
      <div class="mobile-actions mobile-only">
        <BaseButton @click="navigate('search')" variant="secondary" class="mobile-action-btn" aria-label="Search">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </BaseButton>
        <BaseButton @click="$emit('toggle-menu')" variant="secondary" class="mobile-action-btn menu-btn" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </BaseButton>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  selectedYear: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:selectedYear', 'navigate', 'toggle-menu'])

const route = useRoute()
const router = useRouter()

// Development mode indicator
const isDev = computed(() => import.meta.env.DEV)

const navItems = [
  { route: 'map', label: 'MAP' },
  { route: 'search', label: 'SEARCH' },
  { route: 'camps', label: 'CAMPS' },
  { route: 'art', label: 'ART' },
  { route: 'events', label: 'EVENTS' },
  { route: 'infrastructure', label: 'INFRA' },
  { route: 'schedule', label: 'SCHEDULE' },
  { route: 'dust', label: 'DUST' }
]

const navigate = (path) => {
  // Special routes that don't need year
  if (path === 'dust') {
    router.push('/dust')
  } else {
    router.push(`/${props.selectedYear}/${path}`)
  }
}

const isActive = (path) => {
  // Special handling for dust route
  if (path === 'dust') {
    return route.path === '/dust'
  }
  
  // For year-based routes, check both list and detail views
  const routeName = route.name
  
  // Handle detail views by checking if the route name starts with the path
  if (routeName) {
    // For camps, art, events - check if we're on the list or detail view
    if (['camps', 'art', 'events'].includes(path)) {
      return routeName === path || routeName === `${path.slice(0, -1)}-detail`
    }
    
    // For infrastructure, handle both list and detail
    if (path === 'infrastructure') {
      return routeName === 'infrastructure' || routeName === 'infrastructure-detail'
    }
    
    // For other routes, exact match
    return routeName === path
  }
  
  return false
}
</script>

<style scoped>
header {
  background-color: var(--color-bg-header);
  color: var(--color-text-primary);
  padding: 0.75rem 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1000;
  flex-shrink: 0;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Navigation Section */
.nav-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.year-selector-group {
  display: flex;
  align-items: center;
}

.unified-select {
  background-color: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 80px;
}

.unified-select:hover {
  background-color: var(--color-bg-active);
  border-color: var(--color-primary);
}

.unified-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.main-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-btn {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

/* App Title Section */
.app-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: color 0.2s;
  user-select: none;
}

.app-title:hover {
  color: var(--color-primary);
}

.dev-indicator {
  font-size: 0.6rem;
  font-weight: 700;
  color: var(--color-error);
  background: var(--color-error-light);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  margin-left: 0.5rem;
  vertical-align: middle;
  letter-spacing: 0.1em;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-success);
  border: 2px solid var(--color-success-dark);
  padding: 0;
  min-width: 16px;
  min-height: 16px;
  animation: pulse 2s infinite;
}

.status-dot.offline {
  background: var(--color-error);
  border-color: var(--color-error-dark);
  animation: none;
}

.status-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px currentColor;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
  100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

/* Mobile-specific styles using body-level classes */
body.mobile-device header {
  position: sticky;
  top: 0;
  z-index: 2000;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-medium);
  box-shadow: 0 2px 4px var(--color-shadow-light);
  padding: 0.5rem 1rem; /* Reduced padding for mobile */
}

body.mobile-device .header-row {
  padding: 0; /* Remove double padding */
  gap: 0.75rem;
  max-width: none;
}

body.mobile-device .app-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-primary);
  flex: 1;
  text-align: center;
}

body.mobile-device .status-indicator {
  display: none;
}

/* Mobile Action Buttons */
.mobile-actions {
  display: flex;
  gap: 0;
}

.mobile-action-btn {
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
}

.mobile-action-btn:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.mobile-action-btn:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.mobile-action-btn svg {
  width: 20px;
  height: 20px;
}

/* Visibility controls using body-level mobile classes */
body.mobile-device .desktop-only {
  display: none;
}

body.desktop-device .mobile-only {
  display: none;
}

/* Mobile-specific responsive adjustments */
body.mobile-device .header-row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

body.mobile-device .app-title {
  order: 1;
  text-align: left;
  margin: 0;
}
</style>