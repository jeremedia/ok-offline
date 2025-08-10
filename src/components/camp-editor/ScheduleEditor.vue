<template>
  <div class="schedule-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Schedule & Tasks</h3>
        </div>
      </div>
      
      <div v-show="!isCollapsed" class="schedule-content">
        <div class="coming-soon">
          <h4>Coming Soon</h4>
          <ul>
            <li>Build week task assignments</li>
            <li>Event schedule planning</li>
            <li>Shift and duty coordination</li>
            <li>Timeline and milestone tracking</li>
            <li>Setup and breakdown responsibilities</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// State
const isCollapsed = ref(true)
const storageKey = 'campEditorScheduleCollapsed'

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

// Load collapse state on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
})
</script>

<style scoped>
/* Section card */
.section-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  padding: 1.5rem;
  height: fit-content;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  min-height: 2.5rem;
}

.section-header.clickable {
  cursor: pointer;
  margin-bottom: 0;
}

.section-header.clickable:hover h3 {
  color: var(--color-primary);
}

.header-with-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.disclosure-arrow {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  user-select: none;
}

.disclosure-arrow.rotated {
  transform: rotate(-90deg);
}

.section-card h3 {
  color: var(--color-accent);
  margin: 0;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}

.schedule-content {
  margin-top: 1.5rem;
}

.coming-soon {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.coming-soon h4 {
  color: var(--color-accent);
  margin-bottom: 1rem;
}

.coming-soon ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.coming-soon li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.coming-soon li:last-child {
  border-bottom: none;
}
</style>