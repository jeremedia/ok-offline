import { ref } from 'vue'

// Global toast ref that will be set by App.vue
const toastRef = ref(null)

export function setToastRef(ref) {
  toastRef.value = ref.value
}

export function useToast() {
  const showSuccess = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.success(message, duration)
    } else {
      console.warn('Toast not initialized, message:', message)
    }
  }
  
  const showError = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.error(message, duration)
    } else {
      console.warn('Toast not initialized, error:', message)
    }
  }
  
  const showWarning = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.warning(message, duration)
    } else {
      console.warn('Toast not initialized, warning:', message)
    }
  }
  
  const showInfo = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.info(message, duration)
    } else {
      console.warn('Toast not initialized, info:', message)
    }
  }
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}