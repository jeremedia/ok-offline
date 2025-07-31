<template>
  <div class="progressive-loader" :class="{ 'full-screen': fullScreen }">
    <div class="loader-content">
      <!-- Main loading animation -->
      <div class="loading-animation">
        <div v-if="loadingType === 'sync'" class="sync-loader">
          <div class="flame-icon">🔥</div>
          <div class="loading-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
        </div>
        
        <div v-else-if="loadingType === 'search'" class="search-loader">
          <div class="search-icon">🔍</div>
          <div class="search-dots">
            <div class="dot" v-for="i in 3" :key="i"></div>
          </div>
        </div>
        
        <div v-else class="default-loader">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Progress information -->
      <div class="progress-info">
        <h3 v-if="title" class="loader-title">{{ title }}</h3>
        <p v-if="message" class="loader-message">{{ message }}</p>
        
        <!-- Custom slot for additional content -->
        <slot></slot>
        
        <!-- Progress bar for operations with known progress -->
        <div v-if="showProgress && progress >= 0" class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${Math.min(progress, 100)}%` }"
            ></div>
          </div>
          <div class="progress-text">
            <span class="progress-percentage">{{ Math.round(progress) }}%</span>
            <span v-if="eta" class="progress-eta">{{ eta }}</span>
          </div>
        </div>

        <!-- Step indicator for multi-step processes -->
        <div v-if="steps && steps.length > 0" class="steps-container">
          <div class="steps-list">
            <div 
              v-for="(step, index) in steps" 
              :key="index"
              :class="[
                'step-item', 
                { 
                  'step-completed': step.status === 'completed',
                  'step-active': step.status === 'active',
                  'step-error': step.status === 'error'
                }
              ]"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-icon">
                <span v-if="step.status === 'completed'">✅</span>
                <span v-else-if="step.status === 'error'">❌</span>
                <span v-else-if="step.status === 'active'">⏳</span>
                <span v-else>⏸️</span>
              </div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <div v-if="step.description" class="step-description">{{ step.description }}</div>
              </div>
              <div v-if="step.count !== undefined" class="step-count">
                {{ step.count }} {{ step.countLabel || 'items' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tips or additional info -->
        <div v-if="tips && tips.length > 0" class="tips-container">
          <div class="current-tip">
            <span class="tip-icon">💡</span>
            <span class="tip-text">{{ currentTip }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div v-if="showActions" class="loader-actions">
          <button 
            v-if="allowCancel" 
            @click="handleCancel" 
            class="action-btn cancel-btn"
            :disabled="!cancellable"
          >
            Cancel
          </button>
          <button 
            v-if="allowSkip" 
            @click="handleSkip" 
            class="action-btn skip-btn"
          >
            Skip This Step
          </button>
        </div>
      </div>
    </div>

    <!-- Background blur overlay for full-screen mode -->
    <div v-if="fullScreen" class="backdrop"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  // Basic props
  title: String,
  message: String,
  loadingType: {
    type: String,
    default: 'default', // 'sync', 'search', 'default'
    validator: value => ['sync', 'search', 'default'].includes(value)
  },
  fullScreen: {
    type: Boolean,
    default: false
  },
  
  // Progress props
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: -1 // -1 means indeterminate
  },
  eta: String, // Estimated time remaining
  
  // Step-based progress
  steps: {
    type: Array,
    default: () => []
  },
  
  // Tips and help
  tips: {
    type: Array,
    default: () => []
  },
  tipInterval: {
    type: Number,
    default: 3000 // Rotate tips every 3 seconds
  },
  
  // Actions
  showActions: {
    type: Boolean,
    default: false
  },
  allowCancel: {
    type: Boolean,
    default: false
  },
  allowSkip: {
    type: Boolean,
    default: false
  },
  cancellable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['cancel', 'skip'])

const currentTipIndex = ref(0)
const tipInterval = ref(null)

const currentTip = computed(() => {
  if (!props.tips || props.tips.length === 0) return ''
  return props.tips[currentTipIndex.value] || ''
})

// Rotate through tips
const startTipRotation = () => {
  if (!props.tips || props.tips.length <= 1) return
  
  tipInterval.value = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % props.tips.length
  }, props.tipInterval)
}

const stopTipRotation = () => {
  if (tipInterval.value) {
    clearInterval(tipInterval.value)
    tipInterval.value = null
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleSkip = () => {
  emit('skip')
}

// Watch for tips changes
watch(() => props.tips, (newTips) => {
  if (newTips && newTips.length > 1) {
    startTipRotation()
  } else {
    stopTipRotation()
  }
}, { immediate: true })

onMounted(() => {
  if (props.tips && props.tips.length > 1) {
    startTipRotation()
  }
})

onUnmounted(() => {
  stopTipRotation()
})
</script>

<style scoped>
.progressive-loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.progressive-loader.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9000;
  background: var(--color-overlay-dark);
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(4px);
  pointer-events: none;
}

.loader-content {
  background: transparent;
  padding: 0;
  max-width: 500px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
}

/* Only add styling when in full-screen mode */
.progressive-loader.full-screen .loader-content {
  background: var(--color-bg-base);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 2rem;
}

/* Loading animations */
.loading-animation {
  margin-bottom: 2rem;
}

.sync-loader {
  position: relative;
  display: inline-block;
}

.flame-icon {
  font-size: 3rem;
  position: relative;
  z-index: 2;
  animation: flame-flicker 2s ease-in-out infinite;
}

@keyframes flame-flicker {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-2deg); }
  50% { transform: scale(0.95) rotate(1deg); }
  75% { transform: scale(1.05) rotate(-1deg); }
}

.loading-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring {
  position: absolute;
  border: 2px solid transparent;
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.ring-1 {
  width: 60px;
  height: 60px;
  margin: -30px;
  animation-duration: 2s;
}

.ring-2 {
  width: 80px;
  height: 80px;
  margin: -40px;
  animation-duration: 3s;
  animation-direction: reverse;
}

.ring-3 {
  width: 100px;
  height: 100px;
  margin: -50px;
  animation-duration: 4s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.search-icon {
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.search-dots {
  display: flex;
  gap: 0.5rem;
}

.search-dots .dot {
  width: 8px;
  height: 8px;
  background: var(--color-accent);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.search-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.search-dots .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1);
  }
}

.default-loader .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

/* Progress information */
.progress-info {
  text-align: left;
}

.loader-title {
  color: var(--color-accent);
  margin: 0 0 0.75rem 0;
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
}

.loader-message {
  color: var(--color-text-secondary);
  margin: 0 0 1.5rem 0;
  text-align: center;
  line-height: 1.4;
}

.progress-container {
  margin: 1.5rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-header);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.progress-percentage {
  color: var(--color-accent);
  font-weight: bold;
}

/* Steps */
.steps-container {
  margin: 1.5rem 0;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  border-left: 3px solid var(--color-border);
  transition: all 0.2s ease;
  overflow: hidden;
  min-height: 3rem;
}

.step-item.step-completed {
  border-left-color: var(--color-success);
  background: var(--color-success-bg);
}

.step-item.step-active {
  border-left-color: var(--color-accent);
  background: var(--color-accent-bg);
}

.step-item.step-error {
  border-left-color: var(--color-error);
  background: var(--color-error-bg);
}

.step-number {
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay-subtle);
  border-right: 1px solid var(--color-border);
  color: var(--color-text-disabled);
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-item.step-active .step-number {
  color: var(--color-accent);
  background: var(--color-accent-bg);
  border-right-color: var(--color-accent);
}

.step-item.step-completed .step-number {
  color: var(--color-success);
  background: var(--color-success-bg);
  border-right-color: var(--color-success);
}

.step-item.step-error .step-number {
  color: var(--color-error);
  background: var(--color-error-bg);
  border-right-color: var(--color-error);
}

.step-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  padding: 0 1rem;
  min-width: 2.5rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content {
  flex: 1;
  text-align: left;
  padding: 0.75rem 1rem 0.75rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.step-title {
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.step-description {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}

.step-count {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: normal;
  flex-shrink: 0;
  padding-right: 1rem;
  display: flex;
  align-items: center;
}

/* Tips */
.tips-container {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: 6px;
}

.current-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.tip-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: -2px;
}

.tip-text {
  line-height: 1.5;
}

/* Actions */
.loader-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-bg-header);
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.cancel-btn {
  background: var(--color-border);
  color: var(--color-text-secondary);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-btn {
  background: var(--color-primary);
  color: var(--color-text-primary);
}

.skip-btn:hover {
  background: var(--color-primary-hover);
}

/* Responsive */
@media (max-width: 768px) {
  /* Only add padding/margin in full-screen mode */
  .progressive-loader.full-screen .loader-content {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .loader-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>