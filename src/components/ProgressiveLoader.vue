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
  padding: 2rem;
}

.progressive-loader.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9000;
  background: rgba(26, 26, 26, 0.95);
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
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  position: relative;
  z-index: 1;
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
  border-top: 2px solid #FFD700;
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
  background: #FFD700;
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
  border: 4px solid #444;
  border-top: 4px solid #FFD700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

/* Progress information */
.progress-info {
  text-align: left;
}

.loader-title {
  color: #FFD700;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  text-align: center;
}

.loader-message {
  color: #ccc;
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
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8B0000, #FFD700);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #999;
}

.progress-percentage {
  color: #FFD700;
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
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #2a2a2a;
  border-radius: 6px;
  border-left: 3px solid #444;
  transition: all 0.3s ease;
}

.step-item.step-completed {
  border-left-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.step-item.step-active {
  border-left-color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
}

.step-item.step-error {
  border-left-color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

.step-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  text-align: left;
}

.step-title {
  color: #fff;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.step-description {
  color: #999;
  font-size: 0.9rem;
}

.step-count {
  color: #FFD700;
  font-size: 0.9rem;
  font-weight: bold;
  flex-shrink: 0;
}

/* Tips */
.tips-container {
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(139, 0, 0, 0.1);
  border: 1px solid rgba(139, 0, 0, 0.3);
  border-radius: 6px;
}

.current-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-size: 0.9rem;
}

.tip-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.tip-text {
  line-height: 1.4;
}

/* Actions */
.loader-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
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
  background: #444;
  color: #ccc;
}

.cancel-btn:hover:not(:disabled) {
  background: #555;
  color: #fff;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skip-btn {
  background: #8B0000;
  color: #fff;
}

.skip-btn:hover {
  background: #a00;
}

/* Responsive */
@media (max-width: 768px) {
  .loader-content {
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