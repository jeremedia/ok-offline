<template>
  <div class="team-members-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Team Members ({{ teamMembers?.length || 0 }})</h3>
        </div>
        <BaseButton 
          v-show="!isCollapsed"
          variant="secondary" 
          size="sm"
          @click.stop="addNewMember"
        >
          + Add New
        </BaseButton>
      </div>
      
      <div v-show="!isCollapsed" class="team-members-content">
        <!-- Two-Column Layout -->
        <div class="editor-columns">
          <!-- Team Members List (Left) -->
          <div class="members-list-section">
            <div v-if="teamMembers && teamMembers.length > 0" class="members-list">
              <div 
                v-for="member in teamMembers" 
                :key="member.id"
                class="member-list-item"
                :class="{ active: selectedMemberId === member.id }"
                @click="selectMember(member.id)"
              >
                <div class="member-basic-info">
                  <div class="member-name">{{ member.display_name || `${member.first_name} ${member.last_name}` }}</div>
                  <div class="member-email">{{ member.email }}</div>
                  <div class="member-dates">{{ formatDateRange(member.arrival_date, member.departure_date) }}</div>
                </div>
                <div class="member-status">
                  <div class="status-indicator" :class="{ verified: member.is_verified }"></div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-members">
              <p>No team members yet</p>
              <BaseButton variant="primary" @click="addNewMember">Add First Member</BaseButton>
            </div>
          </div>

          <!-- Selected Member Editor (Right) -->
          <div class="member-editor-section">
            <div v-if="selectedMember" class="member-editor">
              <div class="section-header">
                <h3>Edit Member</h3>
                <BaseButton 
                  variant="danger" 
                  size="sm"
                  @click="deleteMember(selectedMember.id)"
                  v-if="selectedMember.id"
                >
                  Delete
                </BaseButton>
              </div>
          
              <div class="member-form">
                <!-- Personal Information -->
                <div class="form-section">
                  <h4>Personal Information</h4>
                  <div class="form-grid">
                    <div class="form-field">
                      <label>First Name *</label>
                      <input 
                        type="text" 
                        v-model="selectedMember.first_name"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Last Name *</label>
                      <input 
                        type="text" 
                        v-model="selectedMember.last_name"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Playa Name</label>
                      <input 
                        type="text" 
                        v-model="selectedMember.playa_name"
                        class="form-input"
                      />
                    </div>
                    <div class="form-field">
                      <label>Email *</label>
                      <input 
                        type="email" 
                        v-model="selectedMember.email"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Phone</label>
                      <input 
                        type="tel" 
                        v-model="selectedMember.phone"
                        class="form-input"
                      />
                    </div>
                  </div>
                </div>

                <!-- Event Details -->
                <div class="form-section">
                  <h4>Event Details</h4>
                  <div class="form-grid">
                    <div class="form-field">
                      <label>Role</label>
                      <select v-model="selectedMember.role" class="form-select">
                        <option value="camp_lead">Camp Lead</option>
                        <option value="veteran">Veteran</option>
                        <option value="virgin">Virgin</option>
                        <option value="day_visitor">Day Visitor</option>
                      </select>
                    </div>
                    <div class="form-field">
                      <label>Arrival Date *</label>
                      <input 
                        type="date" 
                        v-model="selectedMember.arrival_date"
                        class="form-input"
                        required
                      />
                    </div>
                    <div class="form-field">
                      <label>Departure Date</label>
                      <input 
                        type="date" 
                        v-model="selectedMember.departure_date"
                        class="form-input"
                      />
                    </div>
                    <div class="form-field">
                      <label>Duration</label>
                      <div class="form-readonly">{{ calculateDuration(selectedMember.arrival_date, selectedMember.departure_date) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Additional Information -->
                <div class="form-section">
                  <h4>Additional Information</h4>
                  <div class="form-field">
                    <label>Dietary Restrictions</label>
                    <textarea 
                      v-model="selectedMember.dietary_restrictions"
                      class="form-textarea"
                      rows="2"
                      placeholder="Any dietary restrictions or preferences..."
                    ></textarea>
                  </div>
                  <div class="form-field">
                    <label>Skills & Contributions</label>
                    <textarea 
                      v-model="selectedMember.skills"
                      class="form-textarea"
                      rows="2"
                      placeholder="Skills, talents, planned contributions..."
                    ></textarea>
                  </div>
                  <div class="form-field">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        v-model="selectedMember.is_verified"
                        class="form-checkbox"
                      />
                      Verified Member
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-selection">
              <div class="no-selection-content">
                <p>Select a team member to edit their details</p>
                <p class="no-selection-hint">Click on a member from the list on the left</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

// Props
const props = defineProps({
  teamMembers: {
    type: Array,
    required: true
  },
  selectedMemberId: {
    type: [String, Number, null],
    default: null
  }
})

// Emits
const emit = defineEmits(['update:teamMembers', 'update:selectedMemberId'])

// State
const isCollapsed = ref(false) // Expanded by default since it's primary content
const storageKey = 'campEditorTeamMembersCollapsed'

// Computed
const selectedMember = computed(() => {
  if (!props.selectedMemberId || !props.teamMembers) return null
  return props.teamMembers.find(m => m.id === props.selectedMemberId)
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const selectMember = (memberId) => {
  emit('update:selectedMemberId', memberId)
}

const addNewMember = () => {
  const newMember = {
    id: `new_${Date.now()}`, // Temporary ID
    first_name: '',
    last_name: '',
    playa_name: '',
    email: '',
    phone: '',
    role: 'veteran',
    arrival_date: '',
    departure_date: '',
    dietary_restrictions: '',
    skills: '',
    is_verified: false
  }
  
  const updatedMembers = [...props.teamMembers, newMember]
  emit('update:teamMembers', updatedMembers)
  emit('update:selectedMemberId', newMember.id)
}

const deleteMember = (memberId) => {
  const member = props.teamMembers.find(m => m.id === memberId)
  const memberName = member ? `${member.first_name} ${member.last_name}` : 'this member'
  
  const confirmDelete = confirm(`Are you sure you want to delete ${memberName}?`)
  if (!confirmDelete) return
  
  const updatedMembers = props.teamMembers.filter(m => m.id !== memberId)
  emit('update:teamMembers', updatedMembers)
  
  // Select another member or clear selection
  if (updatedMembers.length > 0) {
    const index = props.teamMembers.findIndex(m => m.id === memberId)
    const newIndex = Math.min(index, updatedMembers.length - 1)
    emit('update:selectedMemberId', updatedMembers[newIndex].id)
  } else {
    emit('update:selectedMemberId', null)
  }
}

// Utility functions - PST timezone handling
const formatDateRange = (arrival, departure) => {
  if (!arrival) return 'No dates set'
  
  // Parse date strings safely and display in PST
  // Input format is YYYY-MM-DD from date inputs
  const parseDateToPST = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-').map(Number)
    // Create date in PST timezone explicitly
    const date = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid DST issues
    return date
  }
  
  const formatDateInPST = (date) => {
    if (!date) return 'Invalid'
    // Force PST display regardless of server timezone
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric',
      timeZone: 'America/Los_Angeles' // Force PST/PDT
    })
  }
  
  const arrivalDate = parseDateToPST(arrival)
  const arrivalStr = formatDateInPST(arrivalDate)
  
  if (!departure) return `${arrivalStr} - TBD`
  
  const departureDate = parseDateToPST(departure)
  const departureStr = formatDateInPST(departureDate)
  
  return `${arrivalStr} - ${departureStr}`
}

const calculateDuration = (arrival, departure) => {
  if (!arrival || !departure) return 'TBD'
  
  // Use PST timezone-aware date parsing
  const parseDateToPST = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0) // Use noon PST to avoid DST issues
  }
  
  const arrivalDate = parseDateToPST(arrival)
  const departureDate = parseDateToPST(departure)
  
  if (!arrivalDate || !departureDate) return 'Invalid dates'
  
  const diffTime = departureDate - arrivalDate
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
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

.team-members-content {
  margin-top: 1.5rem;
}

/* Layout */
.editor-columns {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

/* Members list */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.member-list-item:hover {
  border-color: var(--color-border-medium);
  background: var(--color-bg-hover);
}

.member-list-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha-10);
}

.member-basic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.member-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.member-email {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.member-dates {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.member-status {
  flex-shrink: 0;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border-medium);
}

.status-indicator.verified {
  background: var(--color-success);
}

/* Form styles */
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

/* No states */
.no-members, .no-selection {
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

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .editor-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>