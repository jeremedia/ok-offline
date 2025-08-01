<template>
  <footer>
    <div class="footer-content">
      <div class="footer-controls">
        <!-- Theme Selector -->
        <div class="theme-selector-group">
          <label for="footer-theme-selector">Theme:</label>
          <select 
            id="footer-theme-selector" 
            :value="selectedTheme" 
            @change="$emit('update:selectedTheme', $event.target.value)"
            class="unified-select"
          >
            <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
              {{ theme.name }}
            </option>
          </select>
        </div>
        
        <!-- Reset Button -->
        <button @click="$emit('reset')" class="reset-btn">
          🔄 Reset App
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup>
defineProps({
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
</script>

<style scoped>
footer {
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-medium);
  flex-shrink: 0;
  height: 60px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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

.unified-select {
  background-color: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
}

.unified-select:hover {
  background-color: var(--color-bg-active);
  border-color: var(--color-primary);
}

.unified-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.reset-btn {
  background: var(--color-bg-input);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-medium);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-btn:hover {
  background: var(--color-error);
  color: var(--color-text-primary);
  border-color: var(--color-error);
}
</style>