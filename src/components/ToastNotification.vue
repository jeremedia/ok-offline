<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <span class="toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

const getIcon = (type) => {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type] || icons.info
}

const addToast = (message, type = 'info', duration = 5000) => {
  const id = nextId++
  const toast = { id, message, type }
  
  toasts.value.push(toast)
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods for use by other components
defineExpose({
  success: (message, duration) => addToast(message, 'success', duration),
  error: (message, duration) => addToast(message, 'error', duration),
  warning: (message, duration) => addToast(message, 'warning', duration),
  info: (message, duration) => addToast(message, 'info', duration),
  remove: removeToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  box-shadow: var(--shadow-elevated);
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toast:hover {
  transform: translateX(-5px);
}

.toast-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.toast-message {
  flex: 1;
  color: var(--color-text-primary);
  line-height: 1.4;
}

/* Type variants */
.toast-success {
  background: var(--color-bg-elevated);
  border-left: 4px solid var(--color-success);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toast-error {
  background: var(--color-bg-elevated);
  border-left: 4px solid var(--color-error);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toast-warning {
  background: var(--color-bg-elevated);
  border-left: 4px solid var(--color-warning);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toast-info {
  background: var(--color-bg-elevated);
  border-left: 4px solid var(--color-info);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Animations */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
  
  .toast {
    margin-left: 0;
    margin-right: 0;
  }
}
</style>