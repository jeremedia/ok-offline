<template>
  <div class="view-container">
    <div class="fixed-header">
      <div class="header-section">
        <div class="header-nav">
          <BaseButton 
            variant="ghost" 
            size="sm" 
            @click="goBack"
            class="back-btn"
          >
            ← Back
          </BaseButton>
          <div class="header-titles">
            <h2 class="view-title">Camp Editor</h2>
            <p class="view-subtitle">{{ camp?.name || 'Loading...' }} - {{ year }}</p>
          </div>
          <div class="header-actions">
            <div class="save-status" :class="saveStatusClass">
              {{ saveStatusText }}
            </div>
            <BaseButton 
              variant="primary" 
              size="sm" 
              @click="saveChanges"
              :disabled="!isDirty || isSaving"
              :loading="isSaving"
            >
              Save Changes
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    
    <div class="scrollable-content">
      <div class="editor-container">
        <div v-if="loading" class="loading">
          <div class="loading-text">Loading camp data...</div>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="camp" class="editor-layout">
          <!-- Camp Information Section -->
          <CampInfoEditor 
            :camp-data="editingData"
            @update:camp-data="updateCampData"
          />

          <!-- Team Members Section -->
          <TeamMembersEditor 
            :team-members="editingData.team_members || []"
            :selected-member-id="selectedMemberId"
            @update:team-members="updateTeamMembers"
            @update:selected-member-id="updateSelectedMemberId"
          />

          <!-- Kitchen Section -->
          <KitchenEditor />

          <!-- Schedule Section -->
          <ScheduleEditor />

          <!-- Map Section -->
          <MapEditor />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getThemeCamp } from '../services/campService'
import BaseButton from '../components/ui/BaseButton.vue'
import CampInfoEditor from '../components/camp-editor/CampInfoEditor.vue'
import TeamMembersEditor from '../components/camp-editor/TeamMembersEditor.vue'
import KitchenEditor from '../components/camp-editor/KitchenEditor.vue'
import ScheduleEditor from '../components/camp-editor/ScheduleEditor.vue'
import MapEditor from '../components/camp-editor/MapEditor.vue'

const route = useRoute()
const router = useRouter()

// Props
const props = defineProps({
  year: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  }
})

// State
const loading = ref(false)
const error = ref(null)
const camp = ref(null)
const originalData = ref(null)
const editingData = ref(null)
const selectedMemberId = ref(null)
const isSaving = ref(false)

// Load camp data
const loadCamp = async (slug) => {
  if (!slug) return
  
  loading.value = true
  error.value = null
  
  try {
    const campData = await getThemeCamp(slug)
    camp.value = campData
    originalData.value = JSON.parse(JSON.stringify(campData))
    editingData.value = JSON.parse(JSON.stringify(campData))
    
    // Select first member by default
    if (campData.team_members && campData.team_members.length > 0) {
      selectedMemberId.value = campData.team_members[0].id
    }
  } catch (err) {
    error.value = err.message || 'Failed to load camp data'
    console.error('Failed to load camp:', err)
  } finally {
    loading.value = false
  }
}

// Watch for prop changes
watch(() => props.slug, (newSlug) => {
  if (newSlug) {
    loadCamp(newSlug)
  }
}, { immediate: true })

// Navigation
const goBack = () => {
  if (isDirty.value) {
    const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!confirmLeave) return
  }
  router.push(`/${props.year}/camp/${props.slug}`)
}

// Computed properties
const isDirty = computed(() => {
  if (!originalData.value || !editingData.value) return false
  return JSON.stringify(originalData.value) !== JSON.stringify(editingData.value)
})

const selectedMember = computed(() => {
  if (!selectedMemberId.value || !editingData.value?.team_members) return null
  return editingData.value.team_members.find(m => m.id === selectedMemberId.value)
})

const saveStatusText = computed(() => {
  if (isSaving.value) return '💾 Saving...'
  if (isDirty.value) return '⚠️ Unsaved changes'
  return '✅ Saved'
})

const saveStatusClass = computed(() => {
  if (isSaving.value) return 'saving'
  if (isDirty.value) return 'dirty'
  return 'saved'
})

// Component event handlers
const updateCampData = (newCampData) => {
  editingData.value = { ...editingData.value, ...newCampData }
}

const updateTeamMembers = (newTeamMembers) => {
  editingData.value = { ...editingData.value, team_members: newTeamMembers }
}

const updateSelectedMemberId = (memberId) => {
  selectedMemberId.value = memberId
}

// Save functionality (placeholder for now)
const saveChanges = async () => {
  isSaving.value = true
  try {
    // TODO: Implement API save logic
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save
    originalData.value = JSON.parse(JSON.stringify(editingData.value))
    console.log('Changes saved successfully')
  } catch (err) {
    console.error('Failed to save changes:', err)
    alert('Failed to save changes. Please try again.')
  } finally {
    isSaving.value = false
  }
}

// Load on mount
onMounted(() => {
  if (props.slug) {
    loadCamp(props.slug)
  }
})
</script>

<style scoped>
/* Standard view container pattern */
.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.fixed-header {
  flex-shrink: 0;
  padding: 2rem 2rem 0;
  border-bottom: 1px solid var(--color-border-medium);
  background: var(--color-bg-base);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  padding: 2rem;
}

/* Header styling */
.header-nav {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-btn {
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.header-titles {
  flex: 1;
}

.view-title {
  color: var(--color-accent);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: bold;
}

.view-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-status {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.25rem 0;
}

.save-status.saved {
  color: var(--color-success);
}

.save-status.dirty {
  color: var(--color-warning);
}

.save-status.saving {
  color: var(--color-primary);
}

/* Loading/error states */
.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 200px;
}

.loading-text {
  color: var(--color-text-secondary);
}

.error {
  color: var(--color-error);
}

/* Layout */
.editor-container {
  max-width: 1400px;
  margin: 0 auto;
}

.editor-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .fixed-header {
    padding: 1rem 1rem 0.5rem;
  }
  
  .scrollable-content {
    padding: 1rem;
  }
  
  .view-title {
    font-size: 1.25rem;
  }
  
  .header-nav {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .header-actions {
    align-self: stretch;
    justify-content: space-between;
  }
}
</style>