<template>
  <div class="schedule-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Schedule ({{ scheduleItems?.length || 0 }})</h3>
        </div>
        <BaseButton 
          v-show="!isCollapsed"
          variant="secondary" 
          size="sm"
          @click.stop="addNewScheduleItem"
        >
          + Add Event
        </BaseButton>
      </div>
      
      <div v-show="!isCollapsed" class="schedule-content">
        <!-- Category Filters -->
        <div class="category-filters">
          <button 
            v-for="category in categories" 
            :key="category.value"
            class="category-filter" 
            :class="{ active: selectedCategory === category.value }"
            @click="filterByCategory(category.value)"
          >
            {{ category.icon }} {{ category.label }}
          </button>
          <button 
            class="category-filter" 
            :class="{ active: selectedCategory === null }"
            @click="filterByCategory(null)"
          >
            All Categories
          </button>
        </div>

        <!-- Two-Column Layout -->
        <div class="editor-columns">
          <!-- Schedule Items List (Left) -->
          <div class="schedule-list-section">
            <div v-if="filteredScheduleItems && filteredScheduleItems.length > 0" class="schedule-list">
              <div 
                v-for="item in filteredScheduleItems" 
                :key="item.id"
                class="schedule-list-item"
                :class="{ active: selectedItemId === item.id }"
                @click="selectScheduleItem(item.id)"
              >
                <div class="item-basic-info">
                  <div class="item-header">
                    <div class="item-title">{{ item.title }}</div>
                    <div class="item-category">{{ getCategoryIcon(item.category) }} {{ getCategoryLabel(item.category) }}</div>
                  </div>
                  <div class="item-datetime">{{ formatScheduleDateTime(item.start_datetime, item.end_datetime) }}</div>
                  <div class="item-location" v-if="item.location">📍 {{ item.location }}</div>
                  <div class="item-responsible" v-if="item.responsible_person">👤 {{ getPersonName(item.responsible_person) }}</div>
                </div>
                <div class="item-status">
                  <div class="status-indicator" :class="item.status"></div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-schedule-items">
              <p>No schedule items{{ selectedCategory ? ' for this category' : '' }}</p>
              <BaseButton variant="primary" @click="addNewScheduleItem">Add First Event</BaseButton>
            </div>
          </div>

          <!-- Selected Item Editor (Right) -->
          <div class="schedule-editor-section">
            <div v-if="selectedScheduleItem" class="schedule-editor">
              <div class="section-header">
                <h3>Edit Event</h3>
                <BaseButton 
                  variant="danger" 
                  size="sm"
                  @click="deleteScheduleItem(selectedScheduleItem.id)"
                  v-if="selectedScheduleItem.id && !selectedScheduleItem.id.toString().startsWith('new_')"
                >
                  Delete
                </BaseButton>
              </div>
          
              <div class="schedule-form">
                <!-- Basic Information -->
                <div class="form-section">
                  <h4>Event Details</h4>
                  <div class="form-grid">
                    <div class="form-field">
                      <label>Event Title *</label>
                      <input 
                        type="text" 
                        v-model="selectedScheduleItem.title"
                        class="form-input"
                        placeholder="e.g., Morning Coffee Setup"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Category *</label>
                      <select v-model="selectedScheduleItem.category" class="form-select" required>
                        <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                          {{ cat.icon }} {{ cat.label }}
                        </option>
                      </select>
                    </div>
                    <div class="form-field">
                      <label>Status</label>
                      <select v-model="selectedScheduleItem.status" class="form-select">
                        <option value="happening">✅ Happening</option>
                        <option value="draft">📝 Draft</option>
                        <option value="canceled">❌ Canceled</option>
                        <option value="happened">✨ Completed</option>
                        <option value="skipped">⏭️ Skipped</option>
                      </select>
                    </div>
                    <div class="form-field">
                      <label>Location</label>
                      <input 
                        type="text" 
                        v-model="selectedScheduleItem.location"
                        class="form-input"
                        placeholder="e.g., Kitchen Area, Main Stage"
                      />
                    </div>
                  </div>
                </div>

                <!-- Date & Time -->
                <div class="form-section">
                  <h4>Timing (PST)</h4>
                  <div class="form-grid">
                    <div class="form-field">
                      <label>Start Date *</label>
                      <input 
                        type="date" 
                        v-model="selectedScheduleItem.start_date"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Start Time *</label>
                      <input 
                        type="time" 
                        v-model="selectedScheduleItem.start_time"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        v-model="selectedScheduleItem.end_date"
                        class="form-input"
                      />
                    </div>
                    <div class="form-field">
                      <label>End Time</label>
                      <input 
                        type="time" 
                        v-model="selectedScheduleItem.end_time"
                        class="form-input"
                      />
                    </div>
                  </div>
                  <div class="form-field">
                    <label>Duration</label>
                    <div class="form-readonly">{{ calculateDuration() }}</div>
                  </div>
                </div>

                <!-- Description & Supplies -->
                <div class="form-section">
                  <h4>Additional Information</h4>
                  <div class="form-field">
                    <label>Description</label>
                    <textarea 
                      v-model="selectedScheduleItem.description"
                      class="form-textarea"
                      rows="3"
                      placeholder="Event description, goals, context..."
                    ></textarea>
                  </div>
                  <div class="form-field">
                    <label>Required Supplies</label>
                    <textarea 
                      v-model="selectedScheduleItem.required_supplies"
                      class="form-textarea"
                      rows="2"
                      placeholder="Materials, equipment, supplies needed..."
                    ></textarea>
                  </div>
                  <div class="form-field">
                    <label>Notes</label>
                    <textarea 
                      v-model="selectedScheduleItem.notes"
                      class="form-textarea"
                      rows="2"
                      placeholder="Additional notes, reminders..."
                    ></textarea>
                  </div>
                </div>

                <!-- Team Assignment -->
                <div class="form-section">
                  <h4>Team Assignment</h4>
                  <div class="form-field">
                    <label>Responsible Person</label>
                    <select v-model="selectedScheduleItem.responsible_person_id" class="form-select">
                      <option value="">No specific person</option>
                      <option v-for="member in teamMembers" :key="member.id" :value="member.id">
                        {{ getPersonName(member) }}
                      </option>
                    </select>
                  </div>
                  
                  <!-- Assigned Team Members -->
                  <div class="form-field">
                    <label>Assigned Team Members</label>
                    <div class="team-assignments">
                      <div v-if="selectedScheduleItem.assigned_members && selectedScheduleItem.assigned_members.length > 0" class="assigned-list">
                        <div v-for="assignment in selectedScheduleItem.assigned_members" :key="assignment.member_id" class="assignment-item">
                          <div class="assignment-info">
                            <span class="member-name">{{ getMemberName(assignment.member_id) }}</span>
                            <span class="assignment-notes" v-if="assignment.notes">- {{ assignment.notes }}</span>
                          </div>
                          <BaseButton 
                            variant="ghost" 
                            size="sm"
                            @click="removeAssignment(assignment.member_id)"
                          >
                            ×
                          </BaseButton>
                        </div>
                      </div>
                      <BaseButton 
                        variant="secondary" 
                        size="sm"
                        @click="showAssignmentModal = true"
                      >
                        + Assign Members
                      </BaseButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-selection">
              <div class="no-selection-content">
                <p>Select a schedule item to edit details</p>
                <p class="no-selection-hint">Click on an event from the list on the left</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Assignment Modal -->
    <div v-if="showAssignmentModal" class="modal-overlay" @click="closeAssignmentModal">
      <div class="assignment-modal" @click.stop>
        <div class="modal-header">
          <h3>Assign Team Members</h3>
          <BaseButton variant="ghost" size="sm" @click="closeAssignmentModal">×</BaseButton>
        </div>
        
        <div class="modal-body">
          <div v-for="member in availableMembers" :key="member.id" class="member-assignment-option">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="member.selected"
                class="form-checkbox"
              />
              {{ getPersonName(member) }}
            </label>
            <input 
              v-if="member.selected"
              type="text" 
              v-model="member.assignmentNotes"
              class="form-input assignment-notes-input"
              placeholder="Role/notes for this assignment..."
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="closeAssignmentModal">Cancel</BaseButton>
          <BaseButton variant="primary" @click="saveAssignments">Save Assignments</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

// Props
const props = defineProps({
  scheduleData: {
    type: Object,
    default: () => ({ tasks: [] })
  },
  teamMembers: {
    type: Array,
    required: true
  }
})

// Emits
const emit = defineEmits(['update:scheduleData'])

// State
const isCollapsed = ref(false) // Expanded by default since it's primary content
const storageKey = 'campEditorScheduleCollapsed'
const selectedItemId = ref(null)
const selectedCategory = ref(null)
const showAssignmentModal = ref(false)

// Schedule categories with icons (using 🆗🚫 as requested)
const categories = [
  { value: 'public_event', label: 'Public Event', icon: '🎪' },
  { value: 'meal', label: 'Meal', icon: '🍽️' },
  { value: 'arrival', label: 'Arrival', icon: '🆗' },
  { value: 'departure', label: 'Departure', icon: '🚫' },
  { value: 'service', label: 'Service', icon: '🛠️' },
  { value: 'meeting', label: 'Meeting', icon: '👥' }
]

// Computed
const scheduleItems = computed(() => {
  return props.scheduleData?.schedule_items || []
})

const filteredScheduleItems = computed(() => {
  let items = scheduleItems.value
  
  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }
  
  // Sort by start datetime
  return items.sort((a, b) => {
    const aDate = new Date(a.start_datetime || '1970-01-01')
    const bDate = new Date(b.start_datetime || '1970-01-01')
    return aDate - bDate
  })
})

const selectedScheduleItem = computed(() => {
  if (!selectedItemId.value || !scheduleItems.value) return null
  return scheduleItems.value.find(item => item.id === selectedItemId.value)
})

const availableMembers = computed(() => {
  return props.teamMembers.map(member => ({
    ...member,
    selected: false,
    assignmentNotes: ''
  }))
})

const initializeSelectedDateFields = newItem => {
  if (newItem && newItem.start_datetime) {
    // Split datetime into separate date and time fields for easier editing
    const startDate = new Date(newItem.start_datetime)
    if (!newItem.start_date) {
      newItem.start_date = formatDateForInput(startDate)
      newItem.start_time = formatTimeForInput(startDate)
    }
    
    if (newItem.end_datetime) {
      const endDate = new Date(newItem.end_datetime)
      if (!newItem.end_date) {
        newItem.end_date = formatDateForInput(endDate)
        newItem.end_time = formatTimeForInput(endDate)
      }
    }
  }
}

// Reactive changes run after initialization; the initial pass happens on mount.
watch(selectedScheduleItem, initializeSelectedDateFields)

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const selectScheduleItem = (itemId) => {
  selectedItemId.value = itemId
}

const filterByCategory = (category) => {
  selectedCategory.value = category
  // Clear selection if filtered item is no longer visible
  if (selectedItemId.value && !filteredScheduleItems.value.find(item => item.id === selectedItemId.value)) {
    selectedItemId.value = null
  }
}

const addNewScheduleItem = () => {
  const newItem = {
    id: `new_${Date.now()}`, // Temporary ID
    title: '',
    description: '',
    start_date: '',
    start_time: '10:00',
    end_date: '',
    end_time: '11:00',
    start_datetime: '',
    end_datetime: '',
    location: '',
    required_supplies: '',
    notes: '',
    category: 'public_event',
    status: 'happening',
    responsible_person_id: '',
    assigned_members: []
  }
  
  const updatedItems = [...scheduleItems.value, newItem]
  const updatedScheduleData = { ...props.scheduleData, schedule_items: updatedItems }
  emit('update:scheduleData', updatedScheduleData)
  selectedItemId.value = newItem.id
}

const deleteScheduleItem = (itemId) => {
  const item = scheduleItems.value.find(item => item.id === itemId)
  const itemTitle = item ? item.title : 'this event'
  
  const confirmDelete = confirm(`Are you sure you want to delete "${itemTitle}"?`)
  if (!confirmDelete) return
  
  const updatedItems = scheduleItems.value.filter(item => item.id !== itemId)
  const updatedScheduleData = { ...props.scheduleData, schedule_items: updatedItems }
  emit('update:scheduleData', updatedScheduleData)
  
  // Select another item or clear selection
  if (updatedItems.length > 0) {
    const index = scheduleItems.value.findIndex(item => item.id === itemId)
    const newIndex = Math.min(index, updatedItems.length - 1)
    selectedItemId.value = updatedItems[newIndex].id
  } else {
    selectedItemId.value = null
  }
}

// Team assignment methods
const removeAssignment = (memberId) => {
  if (selectedScheduleItem.value && selectedScheduleItem.value.assigned_members) {
    selectedScheduleItem.value.assigned_members = selectedScheduleItem.value.assigned_members.filter(
      assignment => assignment.member_id !== memberId
    )
  }
}

const closeAssignmentModal = () => {
  showAssignmentModal.value = false
  // Reset selection state
  availableMembers.value.forEach(member => {
    member.selected = false
    member.assignmentNotes = ''
  })
}

const saveAssignments = () => {
  if (!selectedScheduleItem.value) return
  
  const newAssignments = availableMembers.value
    .filter(member => member.selected)
    .map(member => ({
      member_id: member.id,
      notes: member.assignmentNotes || ''
    }))
  
  if (!selectedScheduleItem.value.assigned_members) {
    selectedScheduleItem.value.assigned_members = []
  }
  
  // Add new assignments (avoid duplicates)
  newAssignments.forEach(newAssignment => {
    const existing = selectedScheduleItem.value.assigned_members.find(
      a => a.member_id === newAssignment.member_id
    )
    if (!existing) {
      selectedScheduleItem.value.assigned_members.push(newAssignment)
    }
  })
  
  closeAssignmentModal()
}

// Utility functions
const getCategoryIcon = (category) => {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.icon : '📅'
}

const getCategoryLabel = (category) => {
  const cat = categories.find(c => c.value === category)
  return cat ? cat.label : category
}

const getPersonName = (person) => {
  if (!person) return 'Unknown'
  // Use playa_name if available, then first name as requested
  if (person.playa_name) return person.playa_name
  return `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.email || 'Unnamed'
}

const getMemberName = (memberId) => {
  const member = props.teamMembers.find(m => m.id === memberId)
  return getPersonName(member)
}

// PST timezone-aware date formatting
const formatScheduleDateTime = (startDatetime, endDatetime) => {
  if (!startDatetime) return 'No date set'
  
  const formatDateTimeToPST = (datetime) => {
    const date = new Date(datetime)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric', 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Los_Angeles'
    })
  }
  
  const startStr = formatDateTimeToPST(startDatetime)
  if (!endDatetime) return startStr
  
  const endStr = formatDateTimeToPST(endDatetime)
  
  // If same day, just show end time
  const startDate = new Date(startDatetime).toDateString()
  const endDate = new Date(endDatetime).toDateString()
  
  if (startDate === endDate) {
    const endTime = new Date(endDatetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit', 
      hour12: true,
      timeZone: 'America/Los_Angeles'
    })
    return `${startStr} - ${endTime}`
  }
  
  return `${startStr} - ${endStr}`
}

const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0]
}

const formatTimeForInput = (date) => {
  return date.toTimeString().slice(0, 5)
}

const calculateDuration = () => {
  const item = selectedScheduleItem.value
  if (!item || !item.start_date || !item.start_time) return 'TBD'
  
  const startDatetime = combineDateAndTime(item.start_date, item.start_time)
  if (!item.end_date || !item.end_time) return 'Open-ended'
  
  const endDatetime = combineDateAndTime(item.end_date, item.end_time)
  
  const diffMs = endDatetime - startDatetime
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
  }
  
  if (diffHours < 24) {
    const hours = Math.floor(diffHours)
    const minutes = Math.round((diffHours - hours) * 60)
    if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
    return `${hours}h ${minutes}m`
  }
  
  const days = Math.floor(diffHours / 24)
  const remainingHours = Math.round(diffHours % 24)
  if (remainingHours === 0) return `${days} day${days !== 1 ? 's' : ''}`
  return `${days}d ${remainingHours}h`
}

const combineDateAndTime = (date, time) => {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00-07:00`) // Force PST timezone
}

// Load collapse state on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
  initializeSelectedDateFields(selectedScheduleItem.value)
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

/* Category filters */
.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.category-filter {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 20px;
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  white-space: nowrap;
}

.category-filter:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}

.category-filter.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

/* Layout */
.editor-columns {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
}

/* Schedule list */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.schedule-list-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-list-item:hover {
  border-color: var(--color-border-medium);
  background: var(--color-bg-hover);
}

.schedule-list-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha-10);
}

.item-basic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.item-category {
  font-size: 0.75rem;
  color: var(--color-accent);
  font-weight: 500;
}

.item-datetime {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.item-location, .item-responsible {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.item-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-success);
}

.status-indicator.canceled {
  background: var(--color-error);
}

.status-indicator.draft {
  background: var(--color-warning);
}

.status-indicator.happened {
  background: var(--color-primary);
}

.status-indicator.skipped {
  background: var(--color-border-medium);
}

/* Form styles - matching TeamMembersEditor exactly */
.form-section {
  margin-bottom: 2rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h4 {
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
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

.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  gap: 0.5rem !important;
}

.form-input, .form-select, .form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  background: var(--color-bg-input);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha-20);
}

.form-checkbox {
  width: 1rem;
  height: 1rem;
}

.form-readonly {
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

/* Team assignments */
.team-assignments {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assigned-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assignment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
}

.assignment-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.assignment-notes {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.assignment-modal {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-light);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-accent);
}

.modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-assignment-option {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.assignment-notes-input {
  margin-left: 1.5rem;
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--color-border-light);
}

/* No states - matching TeamMembersEditor */
.no-schedule-items, .no-selection {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.no-selection-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-selection-hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* Mobile responsiveness - matching TeamMembersEditor */
@media (max-width: 1200px) {
  .editor-columns {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 1024px) {
  .editor-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .category-filters {
    justify-content: center;
  }
  
  .category-filter {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
}
</style>
