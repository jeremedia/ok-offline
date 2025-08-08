<template>
  <div class="image-loader" :class="{ 'loading': loading, 'error': error }">
    <img
      v-if="imageSrc && !error"
      :src="imageSrc"
      :alt="alt"
      @load="handleLoad"
      @error="handleError"
      class="image"
    />
    <div v-else-if="loading" class="loading-placeholder">
      <div class="loading-spinner"></div>
    </div>
    <div v-else-if="error" class="error-placeholder">
      <span class="error-icon">🖼️</span>
      <span class="error-text">Image unavailable</span>
    </div>
    <div v-else class="empty-placeholder">
      <span class="placeholder-icon">{{ placeholderIcon }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { loadImage } from '@/services/imageService'

const props = defineProps({
  src: {
    type: String,
    default: null
  },
  campId: {
    type: String,
    default: null
  },
  alt: {
    type: String,
    default: 'Camp image'
  },
  placeholderIcon: {
    type: String,
    default: '🏕️'
  },
  eager: {
    type: Boolean,
    default: false
  }
})

const imageSrc = ref(null)
const loading = ref(false)
const error = ref(false)
let objectUrl = null

// Load image from cache or network
async function loadImageData() {
  if (!props.src) {
    loading.value = false
    return
  }

  loading.value = true
  error.value = false

  try {
    const blobUrl = await loadImage(props.src, props.campId)
    if (blobUrl) {
      // Clean up previous object URL if exists
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      objectUrl = blobUrl
      imageSrc.value = blobUrl
    } else {
      // Fallback to direct URL if blob creation fails
      imageSrc.value = props.src
    }
  } catch (err) {
    console.error('Failed to load image:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Handle image load success
function handleLoad() {
  loading.value = false
  error.value = false
}

// Handle image load error
function handleError() {
  loading.value = false
  error.value = true
  
  // If blob URL failed, try direct URL as fallback
  if (imageSrc.value !== props.src && props.src) {
    imageSrc.value = props.src
  }
}

// Watch for src changes
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    loadImageData()
  } else {
    imageSrc.value = null
    error.value = false
  }
})

// Lazy loading with Intersection Observer
let observer = null

onMounted(() => {
  if (props.eager) {
    loadImageData()
  } else {
    // Set up intersection observer for lazy loading
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImageData()
          observer.disconnect()
        }
      })
    }, {
      rootMargin: '50px' // Start loading 50px before visible
    })
    
    observer.observe(document.querySelector('.image-loader'))
  }
})

// Cleanup
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
  }
})
</script>

<style scoped>
.image-loader {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 150px;
  background: var(--color-background-secondary);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.loading-placeholder,
.error-placeholder,
.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-disabled);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon,
.placeholder-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 0.5rem;
}

.error-text {
  font-size: 0.875rem;
  opacity: 0.6;
}

/* Aspect ratio container for consistent sizing */
.image-loader.square {
  aspect-ratio: 1;
}

.image-loader.wide {
  aspect-ratio: 16/9;
}

.image-loader.thumbnail {
  width: 40px;
  height: 40px;
  min-height: 40px;
  border-radius: 4px;
}

.image-loader.thumbnail .error-icon,
.image-loader.thumbnail .placeholder-icon {
  font-size: 1.5rem;
  margin-bottom: 0;
}

.image-loader.thumbnail .error-text {
  display: none;
}
</style>