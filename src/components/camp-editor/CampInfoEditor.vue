<template>
  <div class="camp-info-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Camp Information</h3>
        </div>
      </div>
      
      <div v-show="!isCollapsed" class="camp-info-content">
        <div class="form-grid">
          <div class="form-field">
            <label>Camp Name</label>
            <input 
              type="text" 
              :value="campData.name"
              @input="updateField('name', $event.target.value)"
              class="form-input"
              placeholder="Enter camp name"
            />
          </div>
          <div class="form-field">
            <label>Year</label>
            <input 
              type="number" 
              :value="campData.year"
              class="form-input"
              readonly
            />
          </div>
          <div class="form-field">
            <label>Active</label>
            <input 
              type="checkbox" 
              :checked="campData.is_active"
              @change="updateField('is_active', $event.target.checked)"
              class="form-checkbox"
            />
          </div>
        </div>
        <div class="form-field">
          <label>Description</label>
          <textarea 
            :value="campData.description"
            @input="updateField('description', $event.target.value)"
            class="form-textarea"
            rows="3"
            placeholder="Camp description..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Props
const props = defineProps({
  campData: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:campData'])

// State
const isCollapsed = ref(true) // Collapsed by default
const storageKey = 'campEditorInfoCollapsed'

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const updateField = (field, value) => {
  emit('update:campData', { ...props.campData, [field]: value })
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

.camp-info-content {
  margin-top: 1.5rem;
}

/* Form styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input, .form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.form-input[readonly] {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>