import { ref } from 'vue'

// Global toast ref that will be set by App.vue
const toastRef = ref(null)

export function setToastRef(ref) {
  toastRef.value = ref
}

export function useToast() {
  const showSuccess = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.success(message, duration)
    }
  }
  
  const showError = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.error(message, duration)
    }
  }
  
  const showWarning = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.warning(message, duration)
    }
  }
  
  const showInfo = (message, duration) => {
    if (toastRef.value) {
      toastRef.value.info(message, duration)
    }
  }
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}