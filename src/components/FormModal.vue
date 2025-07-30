<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-container" @click.stop>
          <header class="modal-header">
            <h2>{{ title }}</h2>
            <button @click="$emit('update:modelValue', false)" class="close-btn" aria-label="Close">
              ×
            </button>
          </header>
          
          <div class="modal-body">
            <slot></slot>
          </div>
          
          <footer class="modal-footer">
            <button @click="$emit('update:modelValue', false)" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="handleSave" class="btn btn-primary" :disabled="!isValid || saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue'

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
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background-color: #2a2a2a;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  color: #fff;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #444;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-primary {
  background-color: #8B0000;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #a00000;
}

.btn-primary:disabled {
  background-color: #444;
  color: #999;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #444;
  color: #ccc;
}

.btn-secondary:hover {
  background-color: #555;
  color: #fff;
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