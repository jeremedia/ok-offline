<template>
  <div class="base-loader" :class="loaderClasses">
    <!-- Spinner Element -->
    <div class="loader-spinner" :class="spinnerClasses">
      <div v-if="spinnerType === 'ring'" class="spinner-ring"></div>
      <div v-else-if="spinnerType === 'dots'" class="spinner-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div v-else-if="spinnerType === 'pulse'" class="spinner-pulse"></div>
    </div>
    
    <!-- Loading Message -->
    <div v-if="message" class="loader-message" :class="messageClasses">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props with smart defaults
const props = defineProps({
  // Message to display (optional)
  message: {
    type: String,
    default: ''
  },
  
  // Size: xs, sm, md, lg, xl
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  
  // Display type: inline, block, overlay, center
  display: {
    type: String,
    default: 'center',
    validator: (value) => ['inline', 'block', 'overlay', 'center'].includes(value)
  },
  
  // Spinner type: ring, dots, pulse
  spinnerType: {
    type: String,
    default: 'ring',
    validator: (value) => ['ring', 'dots', 'pulse'].includes(value)
  },
  
  // Custom minimum height for center/overlay modes
  minHeight: {
    type: String,
    default: '200px'
  },
  
  // Show/hide the component
  show: {
    type: Boolean,
    default: true
  }
})

// Computed classes
const loaderClasses = computed(() => [
  `loader-display-${props.display}`,
  `loader-size-${props.size}`,
  { 'loader-hidden': !props.show }
])

const spinnerClasses = computed(() => [
  `spinner-${props.spinnerType}`,
  `spinner-size-${props.size}`
])

const messageClasses = computed(() => [
  `message-size-${props.size}`
])
</script>

<style scoped>
/* TODO: Replace all other loading indicators throughout the app with BaseLoader
 * Current locations to replace:
 * - ListView.vue (.loading-spinner)
 * - CampEditorView.vue (.loading)
 * - SearchView.vue (custom loading states)
 * - DetailView.vue (loading states)
 * - SettingsView.vue (sync loading)
 * - Any other ad-hoc loading implementations
 * 
 * Benefits of replacement:
 * - Consistent loading UX across entire app
 * - No more global CSS class conflicts
 * - Centralized loading component maintenance
 * - Better accessibility and screen reader support
 * - Unified theming and size system
 */

/* Base loader container */
.base-loader {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-secondary);
}

.loader-hidden {
  display: none;
}

/* Display modes */
.loader-display-inline {
  display: inline-flex;
}

.loader-display-block {
  display: flex;
  width: 100%;
}

.loader-display-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: v-bind('props.minHeight');
  padding: 2rem;
}

.loader-display-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-modal-overlay);
  z-index: 1000;
}

/* Spinner container */
.loader-spinner {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Ring spinner (default) */
.spinner-ring .spinner-ring {
  border: 2px solid var(--color-border-light);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-ring {
  border: 2px solid var(--color-border-light);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Dots spinner */
.spinner-dots {
  display: flex;
  gap: 0.25rem;
}

.spinner-dots .dot {
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 1.4s infinite;
}

.spinner-dots .dot:nth-child(1) { animation-delay: 0s; }
.spinner-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.spinner-dots .dot:nth-child(3) { animation-delay: 0.4s; }

/* Pulse spinner */
.spinner-pulse {
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

/* Size variants for spinners */
.spinner-size-xs .spinner-ring,
.spinner-size-xs .spinner-pulse {
  width: 12px;
  height: 12px;
}

.spinner-size-xs .dot {
  width: 3px;
  height: 3px;
}

.spinner-size-sm .spinner-ring,
.spinner-size-sm .spinner-pulse {
  width: 16px;
  height: 16px;
}

.spinner-size-sm .dot {
  width: 4px;
  height: 4px;
}

.spinner-size-md .spinner-ring,
.spinner-size-md .spinner-pulse {
  width: 20px;
  height: 20px;
}

.spinner-size-md .dot {
  width: 5px;
  height: 5px;
}

.spinner-size-lg .spinner-ring,
.spinner-size-lg .spinner-pulse {
  width: 28px;
  height: 28px;
  border-width: 3px;
}

.spinner-size-lg .dot {
  width: 6px;
  height: 6px;
}

.spinner-size-xl .spinner-ring,
.spinner-size-xl .spinner-pulse {
  width: 36px;
  height: 36px;
  border-width: 4px;
}

.spinner-size-xl .dot {
  width: 8px;
  height: 8px;
}

/* Message styling */
.loader-message {
  font-weight: 500;
  white-space: nowrap;
}

.message-size-xs {
  font-size: 0.75rem;
}

.message-size-sm {
  font-size: 0.875rem;
}

.message-size-md {
  font-size: 0.9rem;
}

.message-size-lg {
  font-size: 1rem;
}

.message-size-xl {
  font-size: 1.125rem;
}

/* Loader size adjustments */
.loader-size-xs {
  gap: 0.5rem;
}

.loader-size-sm {
  gap: 0.5rem;
}

.loader-size-md {
  gap: 0.75rem;
}

.loader-size-lg {
  gap: 1rem;
}

.loader-size-xl {
  gap: 1.25rem;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 80%, 100% { 
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring,
  .spinner-pulse,
  .dot {
    animation: none;
  }
  
  /* Show a static indicator when animations are disabled */
  .spinner-ring::after {
    content: '⏳';
    position: absolute;
    font-size: 0.75em;
  }
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .loader-display-center {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .loader-message {
    white-space: normal;
    text-align: center;
  }
}
</style>