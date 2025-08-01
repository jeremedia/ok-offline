<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-container" @click.stop>
          <header class="modal-header">
            <h2>{{ title }}</h2>
            <BaseButton @click="$emit('update:modelValue', false)" variant="ghost" icon="×" size="sm" :uppercase="false" aria-label="Close" class="close-btn" />
          </header>
          
          <div class="modal-body">
            <slot></slot>
          </div>
          
          <footer class="modal-footer">
            <BaseButton @click="$emit('update:modelValue', false)" variant="secondary" :uppercase="false">
              Cancel
            </BaseButton>
            <BaseButton @click="handleSave" variant="primary" :disabled="!isValid || saving" :loading="saving" :uppercase="false">
              {{ saving ? 'Saving...' : 'Save' }}
            </BaseButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import BaseButton from './ui/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const handleBackdropClick = () => {
  emit('update:modelValue', false)
}

const handleSave = () => {
  if (props.isValid && !props.saving) {
    emit('save')
  }
}

// Handle escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false)
  }
}

// Prevent body scroll when modal is open
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
  } else {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background-color: var(--color-bg-elevated);
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px var(--color-overlay-dark);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-medium);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.5rem;
}

.close-btn {
  font-size: 2rem;
  width: 2rem;
  height: 2rem;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border-medium);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-shrink: 0;
}


/* Mobile adjustments */
@media (max-width: 600px) {
  .modal-backdrop {
    padding: 0;
  }
  
  .modal-container {
    max-width: 100%;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>