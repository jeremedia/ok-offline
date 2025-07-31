<template>
  <header :class="{ 'mobile-header': isMobile }">
    <div class="header-row">
      <!-- Desktop Navigation -->
      <div class="nav-section" v-if="!isMobile">
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
          <button 
            v-for="item in navItems" 
            :key="item.route"
            @click="navigate(item.route)" 
            :class="['nav-btn', { active: isActive(item.route) }]"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>
      
      <!-- App Title -->
      <div class="app-title-section">
        <h1 @click="$emit('navigate', 'settings')" class="app-title">OK-OFFLINE</h1>
        <button 
          @click="$emit('navigate', 'settings/data_sync')"
          :class="['status-dot', { offline: !isOnline }]"
          :title="isOnline ? 'Online - Click for data sync' : 'Offline - Click for data sync'"
          aria-label="Connection status and data sync">
        </button>
      </div>
      
      <!-- Mobile Actions -->
      <div class="mobile-actions" v-if="isMobile">
        <button @click="navigate('search')" class="mobile-action-btn" aria-label="Search">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button @click="$emit('toggle-menu')" class="mobile-action-btn menu-btn" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  isMobile: {
    type: Boolean,
    required: true
  },
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
  router.push(`/${path}`)
}

const isActive = (path) => {
  const currentPath = route.path.split('/')[1]
  if (path === 'map' && currentPath === '') return true
  if (path === 'camps' && currentPath === '2025' && route.path.includes('camps')) return true
  if (path === 'art' && currentPath === '2025' && route.path.includes('art')) return true
  if (path === 'events' && currentPath === '2025' && route.path.includes('events')) return true
  return currentPath === path
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
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-btn:hover {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  border-color: var(--color-border-medium);
}

.nav-btn.active {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
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

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-success);
  border: 2px solid var(--color-success-dark);
  cursor: pointer;
  transition: all 0.3s;
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

/* Mobile Header */
.mobile-header {
  position: sticky;
  top: 0;
  z-index: 2000;
  background: var(--color-bg-header);
  border-bottom: 1px solid var(--color-border-medium);
  box-shadow: 0 2px 4px var(--color-shadow-light);
}

.mobile-header .header-row {
  padding: 0.75rem 1rem;
  gap: 0.75rem;
  max-width: none;
}

.mobile-header .app-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-text-primary);
  flex: 1;
  text-align: center;
}

.mobile-header .status-indicator {
  display: none;
}

/* Mobile Action Buttons */
.mobile-actions {
  display: flex;
  gap: 0;
}

.mobile-action-btn {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-heavy);
  color: var(--color-text-secondary);
  min-width: 44px;
  height: 44px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
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

.mobile-action-btn:hover,
.mobile-action-btn:active {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.mobile-action-btn svg {
  width: 20px;
  height: 20px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .header-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .app-title {
    order: 1;
    text-align: left;
    margin: 0;
  }
  
  nav {
    display: none;
  }
}
</style>