<template>
  <div v-if="isActive" class="tour-overlay">
    <!-- Backdrop with spotlight effect -->
    <div class="tour-backdrop" @click="handleBackdropClick">
      <!-- Spotlight hole -->
      <div 
        v-if="currentTarget"
        class="spotlight"
        :style="spotlightStyle"
      ></div>
    </div>

    <!-- Tour tooltip -->
    <div 
      v-if="currentStep"
      class="tour-tooltip"
      :style="tooltipStyle"
      :class="[`tour-tooltip--${tooltipPosition}`, { 'tour-tooltip--visible': showTooltip }]"
    >
      <div class="tour-content">
        <div class="tour-header">
          <h3>{{ currentStep.title }}</h3>
          <button @click="closeTour" class="tour-close" aria-label="Close tour">×</button>
        </div>
        
        <div class="tour-body">
          <p>{{ currentStep.content }}</p>
          
          <!-- Show keyboard shortcut if available -->
          <div v-if="currentStep.shortcut" class="tour-shortcut">
            <strong>💡 Tip:</strong> Press <kbd>{{ currentStep.shortcut }}</kbd>
          </div>
          
          <!-- Show interaction hint -->
          <div v-if="currentStep.interaction" class="tour-interaction">
            <span class="interaction-icon">{{ currentStep.interaction.icon }}</span>
            {{ currentStep.interaction.text }}
          </div>
        </div>
        
        <div class="tour-footer">
          <div class="tour-progress">
            <span class="step-counter">{{ currentStepIndex + 1 }} of {{ tourSteps.length }}</span>
            <div class="progress-dots">
              <div 
                v-for="(step, index) in tourSteps" 
                :key="index"
                :class="['progress-dot', { 
                  active: index === currentStepIndex,
                  completed: index < currentStepIndex 
                }]"
              ></div>
            </div>
          </div>
          
          <div class="tour-actions">
            <button 
              v-if="currentStepIndex > 0"
              @click="previousStep" 
              class="tour-btn tour-btn--secondary"
            >
              ← Previous
            </button>
            
            <button 
              v-if="currentStepIndex < tourSteps.length - 1"
              @click="nextStep" 
              class="tour-btn tour-btn--primary"
            >
              Next →
            </button>
            
            <button 
              v-else
              @click="completeTour" 
              class="tour-btn tour-btn--primary"
            >
              Finish Tour 🔥
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  tourType: {
    type: String,
    default: 'general', // 'general', 'map', 'list', 'search'
    validator: value => ['general', 'map', 'list', 'search'].includes(value)
  },
  autoStart: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['complete', 'skip'])

const route = useRoute()
const router = useRouter()

const isActive = ref(false)
const currentStepIndex = ref(0)
const currentTarget = ref(null)
const showTooltip = ref(false)
const tooltipPosition = ref('bottom')

// Tour step definitions
const tourDefinitions = {
  general: [
    {
      target: '.app-title',
      title: 'Welcome to OK-OFFLINE! 🔥',
      content: 'This is your offline-first guide to Burning Man. Everything works without internet once your data is synced.',
      interaction: { icon: '👆', text: 'Click the title anytime to access Settings' }
    },
    {
      target: 'nav button[data-view="map"]',
      title: 'Interactive Map',
      content: 'Explore Black Rock City with an interactive map showing camps, art installations, and events.',
      shortcut: '1',
      interaction: { icon: '🗺️', text: 'Your home base for navigation' }
    },
    {
      target: 'nav button[data-view="camps"]',
      title: 'Browse Camps',
      content: 'Find theme camps by name, location, or what you\'re looking for. Star your favorites!',
      shortcut: '2',
      interaction: { icon: '⭐', text: 'Use favorites to build your personal guide' }
    },
    {
      target: 'nav button[data-view="search"]',
      title: 'Global Search',
      content: 'Search across camps, art, and events all at once. Perfect for finding specific things.',
      shortcut: 'Cmd+K',
      interaction: { icon: '🔍', text: 'Pro tip: Use keyboard shortcut for quick access' }
    },
    {
      target: 'nav button[data-view="schedule"]',
      title: 'Personal Schedule',
      content: 'Build your burn schedule and get notifications about conflicts. Never miss what matters to you!',
      shortcut: '6',
      interaction: { icon: '📅', text: 'Add events from any view' }
    },
    {
      target: '.status-indicator',
      title: 'Offline Status',
      content: 'This shows your connection status and when data was last synced. Green means you\'re good to go!',
      interaction: { icon: '🔴🟢', text: 'Works fully offline once synced' }
    }
  ],
  
  map: [
    {
      target: '.map-controls',
      title: 'Map Controls',
      content: 'Toggle different layers to see camps, art, events, and Black Rock City infrastructure.',
      interaction: { icon: '👆', text: 'Try toggling layers on and off' }
    },
    {
      target: '.map-control input[type="checkbox"]',
      title: 'Layer Toggles',
      content: 'Show or hide camps, art, events, and city features. Favorites mode shows only your starred items.',
      shortcut: 'L',
      interaction: { icon: '⭐', text: 'Use Favorites Only to see your personal map' }
    },
    {
      target: '#map',
      title: 'Interactive Map',
      content: 'Click markers for details, drag to pan, scroll to zoom. The map shows Black Rock City\'s unique coordinate system.',
      interaction: { icon: '🖱️', text: 'Click any marker to see details and add to favorites' }
    }
  ],
  
  list: [
    {
      target: '.search-input',
      title: 'Quick Filter',
      content: 'Type to instantly filter the list by name. Great for finding specific camps or events.',
      shortcut: '/',
      interaction: { icon: '⚡', text: 'Results update as you type' }
    },
    {
      target: '#sort-selector',
      title: 'Smart Sorting',
      content: 'Sort by name, location, sector, or distance (if location enabled). Each sort shows different groupings.',
      interaction: { icon: '📊', text: 'Try different sorts to explore the data' }
    },
    {
      target: '.favorites-toggle',
      title: 'Favorites Filter',
      content: 'Toggle to show only your favorited items. Build your personal burn guide by starring things you love!',
      shortcut: 'F',
      interaction: { icon: '⭐', text: 'Star items by clicking the ☆ button' }
    }
  ],
  
  search: [
    {
      target: '.search-input',
      title: 'Universal Search',
      content: 'Search across all camps, art, and events at once. Find exactly what you\'re looking for.',
      shortcut: 'Cmd+K',
      interaction: { icon: '🔍', text: 'Search by name, description, or any text' }
    },
    {
      target: '.filter-buttons',
      title: 'Filter Results',
      content: 'Narrow results to specific types. Useful when you know you\'re looking for a camp vs an event.',
      interaction: { icon: '🎯', text: 'Combine search text with type filters' }
    }
  ]
}

const tourSteps = computed(() => {
  return tourDefinitions[props.tourType] || tourDefinitions.general
})

const currentStep = computed(() => {
  return tourSteps.value[currentStepIndex.value] || null
})

// Spotlight positioning
const spotlightStyle = ref({})
const tooltipStyle = ref({})

const updateTargetPosition = async () => {
  if (!currentStep.value?.target) return
  
  await nextTick()
  
  const element = document.querySelector(currentStep.value.target)
  if (!element) {
    console.warn(`Tour target not found: ${currentStep.value.target}`)
    return
  }
  
  currentTarget.value = element
  const rect = element.getBoundingClientRect()
  
  // Create spotlight effect
  spotlightStyle.value = {
    left: `${rect.left - 8}px`,
    top: `${rect.top - 8}px`,
    width: `${rect.width + 16}px`,
    height: `${rect.height + 16}px`,
  }
  
  // Position tooltip
  const tooltipWidth = 320
  const tooltipHeight = 200 // Approximate
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Determine best position for tooltip
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const spaceRight = viewportWidth - rect.right
  const spaceLeft = rect.left
  
  let position = 'bottom'
  let left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
  let top = rect.bottom + 20
  
  // Adjust position based on available space
  if (spaceBelow < tooltipHeight && spaceAbove > tooltipHeight) {
    position = 'top'
    top = rect.top - tooltipHeight - 20
  } else if (spaceRight < tooltipWidth / 2 && spaceLeft > tooltipWidth / 2) {
    position = 'left'
    left = rect.left - tooltipWidth - 20
    top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
  } else if (spaceLeft < tooltipWidth / 2 && spaceRight > tooltipWidth / 2) {
    position = 'right'
    left = rect.right + 20
    top = rect.top + (rect.height / 2) - (tooltipHeight / 2)
  }
  
  // Keep tooltip within viewport
  left = Math.max(10, Math.min(left, viewportWidth - tooltipWidth - 10))
  top = Math.max(10, Math.min(top, viewportHeight - tooltipHeight - 10))
  
  tooltipPosition.value = position
  tooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${tooltipWidth}px`
  }
  
  // Show tooltip with slight delay for smooth animation
  setTimeout(() => {
    showTooltip.value = true
  }, 100)
}

const nextStep = async () => {
  if (currentStepIndex.value < tourSteps.value.length - 1) {
    showTooltip.value = false
    currentStepIndex.value++
    await updateTargetPosition()
  }
}

const previousStep = async () => {
  if (currentStepIndex.value > 0) {
    showTooltip.value = false
    currentStepIndex.value--
    await updateTargetPosition()
  }
}

const startTour = async () => {
  isActive.value = true
  currentStepIndex.value = 0
  await updateTargetPosition()
}

const closeTour = () => {
  isActive.value = false
  showTooltip.value = false
  emit('skip')
}

const completeTour = () => {
  isActive.value = false
  showTooltip.value = false
  
  // Mark tour as completed
  localStorage.setItem(`tour_completed_${props.tourType}`, 'true')
  
  emit('complete')
}

const handleBackdropClick = (event) => {
  // Only close if clicking on backdrop, not on highlighted element
  if (event.target.classList.contains('tour-backdrop')) {
    closeTour()
  }
}

// Handle window resize
const handleResize = () => {
  if (isActive.value) {
    updateTargetPosition()
  }
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (!isActive.value) return
  
  switch (event.key) {
    case 'Escape':
      closeTour()
      break
    case 'ArrowRight':
    case ' ':
      event.preventDefault()
      nextStep()
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousStep()
      break
  }
}

onMounted(() => {
  if (props.autoStart) {
    startTour()
  }
  
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeydown)
})

// Expose methods for parent component
defineExpose({
  startTour,
  closeTour,
  nextStep,
  previousStep
})
</script>

<style scoped>
.tour-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
}

.tour-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-modal-overlay);
  pointer-events: all;
}

.spotlight {
  position: absolute;
  background: transparent;
  border-radius: 8px;
  box-shadow: 
    0 0 0 4px var(--color-accent-alpha-80),
    0 0 0 9999px var(--color-modal-overlay);
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 10000;
}

.tour-tooltip {
  position: absolute;
  background: var(--color-bg-base);
  border: 2px solid var(--color-accent);
  border-radius: 8px;
  box-shadow: 0 8px 32px var(--color-shadow-dark);
  pointer-events: all;
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
  transition: all 0.3s ease;
  z-index: 10001;
  max-width: 320px;
}

.tour-tooltip--visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Tooltip positioning arrows */
.tour-tooltip--bottom::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid var(--color-accent);
}

.tour-tooltip--top::before {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--color-accent);
}

.tour-tooltip--left::before {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 10px solid var(--color-accent);
}

.tour-tooltip--right::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-right: 10px solid var(--color-accent);
}

.tour-content {
  padding: 1.5rem;
}

.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tour-header h3 {
  color: var(--color-accent);
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.3;
}

.tour-close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.tour-close:hover {
  color: var(--color-accent);
}

.tour-body {
  margin-bottom: 1.5rem;
}

.tour-body p {
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.tour-shortcut {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin: 0.75rem 0;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.tour-shortcut kbd {
  background: var(--color-bg-input);
  color: var(--color-accent);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-family: monospace;
}

.tour-interaction {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
  padding: 0.5rem 0.75rem;
  background: var(--color-primary-alpha-20);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 4px 4px 0;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.interaction-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.tour-footer {
  border-top: 1px solid var(--color-border-light);
  padding-top: 1rem;
}

.tour-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.step-counter {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
}

.progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-bg-input);
  transition: background-color 0.2s;
}

.progress-dot.active {
  background: var(--color-primary);
}

.progress-dot.completed {
  background: var(--color-accent);
}

.tour-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.tour-btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.tour-btn--primary {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.tour-btn--primary:hover {
  background: var(--color-primary-hover);
}

.tour-btn--secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.tour-btn--secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tour-tooltip {
    max-width: calc(100vw - 2rem);
    margin: 0 1rem;
  }
  
  .tour-content {
    padding: 1rem;
  }
  
  .tour-actions {
    flex-direction: column;
  }
  
  .tour-btn {
    width: 100%;
  }
}
</style>