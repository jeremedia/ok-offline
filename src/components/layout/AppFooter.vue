<template>
  <footer>
    <div class="footer-content">
      <div class="footer-controls">
        <!-- Theme Selector -->
        <div class="theme-selector-group">
          <label for="footer-theme-selector">Theme:</label>
          <BaseSelect 
            :modelValue="selectedTheme" 
            @update:modelValue="$emit('update:selectedTheme', $event)"
            :options="themeOptions"
            class="theme-select"
          />
        </div>
        
        <!-- Reset Button -->
        <BaseButton @click="$emit('reset')" variant="secondary" class="reset-btn">
          🔄 Reset App
        </BaseButton>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import BaseSelect from '../ui/BaseSelect.vue'

const props = defineProps({
  selectedTheme: {
    type: String,
    required: true
  },
  availableThemes: {
    type: Array,
    required: true
  }
})

defineEmits(['update:selectedTheme', 'reset'])

// Transform themes for BaseSelect format
const themeOptions = computed(() => 
  props.availableThemes.map(theme => ({
    value: theme.id,
    label: theme.name
  }))
)
</script>

<style scoped>
footer {
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-medium);
  flex-shrink: 0;
  height: 60px;
  position: relative;
  z-index: 100;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Fix Chrome select dropdown positioning bug */
  transform: translateZ(0);
  will-change: transform;
}

.footer-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.theme-selector-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-selector-group label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.theme-select {
  min-width: 120px;
}

.reset-btn {
  white-space: nowrap;
}

.reset-btn:hover {
  --button-bg: var(--color-error);
  --button-border: var(--color-error);
  --button-text: var(--color-text-primary);
}
</style>