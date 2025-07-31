<template>
  <div>
    <!-- Overlay -->
    <transition name="menu-overlay">
      <div v-if="show" class="mobile-menu-overlay" @click="$emit('close')"></div>
    </transition>
    
    <!-- Menu Panel -->
    <transition name="menu-slide">
      <div v-if="show" class="mobile-menu">
        <div class="mobile-menu-header">
          <h3>MENU</h3>
          <button @click="$emit('close')" class="close-menu-btn" aria-label="Close menu">
            ✕
          </button>
        </div>
        
        <div class="mobile-menu-content">
          <!-- Year Selector -->
          <div class="menu-section">
            <label for="mobile-year-selector" class="menu-label">YEAR</label>
            <select 
              id="mobile-year-selector" 
              :value="selectedYear" 
              @change="handleYearChange"
              class="menu-select"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
          </div>
          
          <!-- Additional Navigation -->
          <div class="menu-section">
            <h4 class="menu-section-title">MORE</h4>
            <button @click="navigateTo('infrastructure')" class="menu-nav-btn">
              <span class="menu-icon">🏛️</span>
              <span class="menu-text">Infrastructure</span>
            </button>
            <button @click="navigateTo('dust')" class="menu-nav-btn">
              <span class="menu-icon">🌪️</span>
              <span class="menu-text">Weather</span>
            </button>
            <button @click="navigateTo('search')" class="menu-nav-btn">
              <span class="menu-icon">🔍</span>
              <span class="menu-text">Search</span>
            </button>
            <button @click="navigateTo('settings')" class="menu-nav-btn">
              <span class="menu-icon">⚙️</span>
              <span class="menu-text">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  selectedYear: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'update:selectedYear'])

const router = useRouter()

const handleYearChange = (event) => {
  emit('update:selectedYear', event.target.value)
}

const navigateTo = (route) => {
  // Routes that don't need year
  if (['dust', 'settings'].includes(route)) {
    router.push(`/${route}`)
  } else {
    // Routes that need year (infrastructure, search, etc)
    router.push(`/${props.selectedYear}/${route}`)
  }
  emit('close')
}
</script>

<style scoped>
/* Mobile Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2998;
  backdrop-filter: blur(4px);
}

/* Mobile Menu Panel */
.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--color-bg-base);
  z-index: 2999;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-medium);
  background: var(--color-bg-header);
}

.mobile-menu-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  font-weight: bold;
}

.close-menu-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-menu-btn:hover {
  color: var(--color-text-primary);
}

.mobile-menu-content {
  padding: 1.5rem 1rem;
}

.menu-section {
  margin-bottom: 2rem;
}

.menu-label,
.menu-section-title {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.menu-select {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.menu-nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-nav-btn:hover {
  background: var(--color-bg-active);
  border-color: var(--color-primary);
  transform: translateX(2px);
}

.menu-icon {
  font-size: 1.25rem;
  width: 1.5rem;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-weight: 500;
}

/* Transitions */
.menu-overlay-enter-active,
.menu-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.menu-overlay-enter-from,
.menu-overlay-leave-to {
  opacity: 0;
}

.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: transform 0.3s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateX(-100%);
}
</style>