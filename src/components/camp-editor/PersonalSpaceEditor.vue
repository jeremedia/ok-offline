<template>
  <div class="personal-space-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Personal Space</h3>
        </div>
        <BaseButton 
          v-show="!isCollapsed && !personalSpace && !isEditing"
          variant="secondary" 
          size="sm"
          @click.stop="startCreating"
        >
          + Add Space
        </BaseButton>
        <div v-show="!isCollapsed && personalSpace && !isEditing" class="space-actions">
          <BaseButton variant="ghost" size="sm" @click="startEditing">Edit</BaseButton>
          <BaseButton variant="danger" size="sm" @click="confirmDelete">Delete</BaseButton>
        </div>
      </div>
      
      <div v-show="!isCollapsed" class="personal-space-content">
    
    <!-- Personal Space Display -->
    <div v-if="personalSpace && !isEditing" class="space-display">
      <div class="space-info-grid">
        <div class="space-info-item">
          <label>Type</label>
          <span class="space-type">{{ formatSpaceType(personalSpace.space_type) }}</span>
        </div>
        <div class="space-info-item">
          <label>Dimensions</label>
          <span class="dimensions">{{ formatDimensions(personalSpace) }}</span>
        </div>
        <div class="space-info-item">
          <label>Status</label>
          <span class="status" :class="{ confirmed: personalSpace.is_confirmed }">
            {{ personalSpace.is_confirmed ? 'Confirmed' : 'Pending' }}
          </span>
        </div>
        <div class="space-info-item">
          <label>Floor Area</label>
          <span class="area">{{ calculateArea(personalSpace) }} sq ft</span>
        </div>
      </div>
    </div>
    
    <!-- Personal Space Editor Form -->
    <div v-if="isEditing || isCreating" class="space-editor">
      <div class="form-grid">
        <div class="form-field">
          <label>Space Type *</label>
          <select v-model="editingSpace.space_type" class="form-select" required>
            <option value="">Select type...</option>
            <option value="tent">Tent</option>
            <option value="rv">RV/Trailer</option>
            <option value="hexayurt">Hexayurt</option>
            <option value="shade_structure">Shade Structure</option>
            <option value="container">Container</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div class="form-field">
          <label>Width (feet) *</label>
          <input 
            type="number" 
            v-model.number="editingSpace.width"
            class="form-input"
            min="1"
            max="50"
            step="0.5"
            placeholder="10"
            required
          />
        </div>
        
        <div class="form-field">
          <label>Depth (feet) *</label>
          <input 
            type="number" 
            v-model.number="editingSpace.depth"
            class="form-input"
            min="1"
            max="50"
            step="0.5"
            placeholder="10"
            required
          />
        </div>
        
        <div class="form-field">
          <label>Height (feet)</label>
          <input 
            type="number" 
            v-model.number="editingSpace.height"
            class="form-input"
            min="1"
            max="20"
            step="0.5"
            placeholder="8"
          />
        </div>
        
        <div class="form-field full-width">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="editingSpace.is_confirmed"
              class="form-checkbox"
            />
            Space Confirmed (location and setup finalized)
          </label>
        </div>
      </div>
      
      <!-- Live calculations -->
      <div v-if="editingSpace.width && editingSpace.depth" class="space-calculations">
        <div class="calculation-item">
          <span class="calc-label">Floor Area:</span>
          <span class="calc-value">{{ calculateArea(editingSpace) }} sq ft</span>
        </div>
        <div v-if="editingSpace.height" class="calculation-item">
          <span class="calc-label">Volume:</span>
          <span class="calc-value">{{ calculateVolume(editingSpace) }} cu ft</span>
        </div>
        <div class="calculation-item">
          <span class="calc-label">Perimeter:</span>
          <span class="calc-value">{{ calculatePerimeter(editingSpace) }} ft</span>
        </div>
      </div>
      
      <!-- Form Actions -->
      <div class="form-actions">
        <BaseButton variant="ghost" @click="cancelEditing">Cancel</BaseButton>
        <BaseButton 
          variant="primary" 
          @click="saveSpace"
          :disabled="!isFormValid"
        >
          {{ isCreating ? 'Create Space' : 'Save Changes' }}
        </BaseButton>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!personalSpace && !isEditing && !isCreating" class="no-space">
      <div class="no-space-content">
        <div class="no-space-icon">🏕️</div>
        <p>No personal space defined</p>
        <p class="no-space-hint">Add dimensions for this member's tent, RV, or structure</p>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

// Props
const props = defineProps({
  personalSpace: {
    type: Object,
    default: null
  },
  memberId: {
    type: [String, Number],
    required: true
  },
  memberName: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:personalSpace', 'create', 'delete'])

// Local state
const isCollapsed = ref(false) // Expanded by default since it's important content
const storageKey = 'campEditorPersonalSpaceCollapsed'
const isEditing = ref(false)
const isCreating = ref(false)
const editingSpace = ref({
  space_type: '',
  width: null,
  depth: null,
  height: 8,
  is_confirmed: false
})

// Computed
const isFormValid = computed(() => {
  return editingSpace.value.space_type &&
         editingSpace.value.width > 0 &&
         editingSpace.value.depth > 0
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const formatSpaceType = (type) => {
  const types = {
    tent: 'Tent',
    rv: 'RV/Trailer',
    hexayurt: 'Hexayurt',
    shade_structure: 'Shade Structure',
    container: 'Container',
    other: 'Other'
  }
  return types[type] || type
}

const formatDimensions = (space) => {
  if (!space || !space.width || !space.depth) return 'Not specified'
  
  const width = space.width % 1 === 0 ? space.width : space.width.toFixed(1)
  const depth = space.depth % 1 === 0 ? space.depth : space.depth.toFixed(1)
  const height = space.height ? 
    (space.height % 1 === 0 ? space.height : space.height.toFixed(1)) : ''
  
  return height ? `${width}' × ${depth}' × ${height}'` : `${width}' × ${depth}'`
}

const calculateArea = (space) => {
  if (!space?.width || !space?.depth) return 0
  return (space.width * space.depth).toFixed(1)
}

const calculateVolume = (space) => {
  if (!space?.width || !space?.depth || !space?.height) return 0
  return (space.width * space.depth * space.height).toFixed(1)
}

const calculatePerimeter = (space) => {
  if (!space?.width || !space?.depth) return 0
  return ((space.width + space.depth) * 2).toFixed(1)
}

const startCreating = () => {
  isCreating.value = true
  editingSpace.value = {
    space_type: '',
    width: null,
    depth: null,
    height: 8,
    is_confirmed: false
  }
}

const startEditing = () => {
  isEditing.value = true
  editingSpace.value = { ...props.personalSpace }
}

const cancelEditing = () => {
  isEditing.value = false
  isCreating.value = false
  editingSpace.value = {
    space_type: '',
    width: null,
    depth: null,
    height: 8,
    is_confirmed: false
  }
}

const saveSpace = () => {
  if (!isFormValid.value) return
  
  if (isCreating.value) {
    emit('create', { ...editingSpace.value, team_member_id: props.memberId })
  } else {
    emit('update:personalSpace', { ...props.personalSpace, ...editingSpace.value })
  }
  
  cancelEditing()
}

const confirmDelete = () => {
  const confirmed = confirm(`Remove personal space for ${props.memberName}?`)
  if (confirmed) {
    emit('delete', props.personalSpace.id)
  }
}

// Watch for prop changes
// Load collapse state on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
})

watch(() => props.personalSpace, (newSpace) => {
  if (newSpace && !isEditing.value && !isCreating.value) {
    // Reset form when personal space changes externally
    cancelEditing()
  }
}, { deep: true })
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

.personal-space-content {
  margin-top: 1.5rem;
  font-weight: 600;
}

.space-actions {
  display: flex;
  gap: 0.5rem;
}

/* Space display */
.space-display {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 1rem;
}

.space-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.space-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.space-info-item label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.space-type, .dimensions, .area {
  color: var(--color-text-primary);
  font-weight: 500;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 500;
  background: var(--color-warning-alpha-20);
  color: var(--color-warning);
  width: fit-content;
}

.status.confirmed {
  background: var(--color-success-alpha-20);
  color: var(--color-success);
}

/* Space editor form */
.space-editor {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
}

.form-input, .form-select {
  padding: 0.75rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
}

/* Space calculations */
.space-calculations {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.calculation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.calculation-item:last-child {
  border-bottom: none;
}

.calc-label {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.calc-value {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Empty state */
.no-space {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.no-space-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.no-space-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.no-space-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .space-info-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>