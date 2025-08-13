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
        
        <!-- Date Override Controls -->
        <div class="date-override-group">
          <label class="date-override-checkbox">
            <input 
              type="checkbox" 
              :checked="dateOverrideEnabled"
              @change="toggleDateOverride"
            />
            <span>Override Date</span>
          </label>
          <input 
            v-if="dateOverrideEnabled"
            type="date"
            :value="overrideDate"
            @change="setOverrideDate($event.target.value)"
            class="date-input"
          />
        </div>

        <!-- Theme Editor Button (Dev Only) -->
        <BaseButton 
          v-if="isDevelopment" 
          @click="$emit('openThemeEditor')" 
          variant="secondary" 
          class="theme-editor-btn"
          title="Open Theme Editor (Cmd+Shift+T)"
        >
          🎨 Theme Editor
        </BaseButton>
        
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
import { useDateOverride } from '../../composables/useDateOverride'

const isDevelopment = import.meta.env.DEV

// Date override functionality
const { dateOverrideEnabled, overrideDate, toggleDateOverride, setOverrideDate } = useDateOverride()

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

defineEmits(['update:selectedTheme', 'reset', 'openThemeEditor'])

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

.date-override-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-override-checkbox {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.date-override-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.date-input {
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-heavy);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}
</style>