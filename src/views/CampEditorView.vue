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
        <BaseLoader 
          v-if="loading" 
          message="Loading camp data..."
          display="center"
          size="lg"
        />
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="camp" class="editor-layout">
          <!-- Camp Information Section -->
          <CampInfoEditor 
            :camp-data="campData"
            @update:camp-data="updateCampData"
          />

          <!-- Team Members Section -->
          <TeamMembersEditor 
            :team-members="campData?.team_members || []"
            :selected-member-id="selectedMemberId"
            @update:team-members="updateTeamMembers"
            @update:selected-member-id="updateSelectedMemberId"
          />

          <!-- Personal Space Section -->
          <PersonalSpaceEditor
            v-if="selectedMember"
            :member="selectedMember"
            :member-id="selectedMember.id"
            :member-name="`${selectedMember.first_name} ${selectedMember.last_name}`"
            :team-members="campData?.team_members || []"
            @create="handlePersonalSpaceCreate"
            @update="handlePersonalSpaceUpdate"
            @delete="handlePersonalSpaceDelete"
          />

          <!-- Kitchen Section -->
          <KitchenEditor 
            :kitchen-data="campData?.kitchen || {}"
            :team-members="campData?.team_members || []"
            @update:kitchen-data="updateKitchenData"
          />

          <!-- Schedule Section -->
          <ScheduleEditor 
            :schedule-data="campData?.schedule || { schedule_items: [] }"
            :team-members="campData?.team_members || []"
            @update:schedule-data="updateScheduleData"
          />

          <!-- Camp Map Section -->
          <CampMapEditor 
            :camp-map="campData?.camp_map || { map_placements: [] }"
            :team-members="campData?.team_members || []"
            @update:camp-map="updateCampMap"
            @update:map-placements="updateMapPlacements"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampEditor } from '../composables/useCampEditor'
import { useToast } from '../composables/useToast'
import { BaseButton, BaseLoader } from '../components/ui'
import CampInfoEditor from '../components/camp-editor/CampInfoEditor.vue'
import TeamMembersEditor from '../components/camp-editor/TeamMembersEditor.vue'
import PersonalSpaceEditor from '../components/camp-editor/PersonalSpaceEditor.vue'
import CampMapEditor from '../components/camp-editor/CampMapEditor.vue'
import KitchenEditor from '../components/camp-editor/KitchenEditor.vue'
import ScheduleEditor from '../components/camp-editor/ScheduleEditor.vue'

const route = useRoute()
const router = useRouter()
const { showSuccess, showError } = useToast()

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

// Use the comprehensive camp editor composable
const {
  // Core state
  campData,
  isLoading,
  isSaving,
  isDirty,
  errors,
  
  // Core operations
  loadCamp,
  saveAll,
  validate,
  clearErrors,
  
  // History operations
  canUndo,
  canRedo,
  undo,
  redo,
  
  // Team member operations
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  
  // Map placement operations
  addMapPlacement,
  removeMapPlacement,
  
  // Change detection
  getAllChanges
} = useCampEditor(props.slug)

// Local state for UI
const selectedMemberId = ref(null)
const error = ref(null)

// Watch for prop changes - load camp data when slug changes
// IMPORTANT: Do NOT use { immediate: true } here - follows app-wide pattern
// - onMounted() handles initial loading (see below)
// - immediate: true would cause temporal dead zone error (loadCampData called before declaration)
// - All other views (ListView, DetailView, SearchView) use this same pattern
watch(() => props.slug, (newSlug) => {
  if (newSlug) {
    loadCampData()
  }
})

// Load camp data using the composable
const loadCampData = async () => {
  try {
    await loadCamp()
    
    // Select first member by default
    if (campData.value?.team_members && campData.value.team_members.length > 0) {
      selectedMemberId.value = campData.value.team_members[0].id
    }
  } catch (err) {
    error.value = err.message || 'Failed to load camp data'
    console.error('Failed to load camp:', err)
    showError(error.value)
  }
}

// Navigation
const goBack = () => {
  if (isDirty.value) {
    const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?')
    if (!confirmLeave) return
  }
  router.push(`/${props.year}/camp/${props.slug}`)
}

// Computed properties
const selectedMember = computed(() => {
  if (!selectedMemberId.value || !campData.value?.team_members) return null
  return campData.value.team_members.find(m => m.id === selectedMemberId.value)
})

const camp = computed(() => campData.value)
const loading = computed(() => isLoading.value)
const editingData = computed(() => campData.value)

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

// Component event handlers for UI interactions
const updateSelectedMemberId = (memberId) => {
  selectedMemberId.value = memberId
}

// Camp data updates using composable methods
const updateCampData = (newCampData) => {
  if (!campData.value) return
  // Avoid readonly mutation by using proper Vue reactivity
  const current = toRaw(campData.value)
  Object.assign(current, newCampData)
}

const updateTeamMembers = (members) => {
  if (!campData.value) return
  // Use the composable's method instead of direct mutation
  // The composable should handle this update properly
  console.warn('updateTeamMembers called - should use individual team member update methods')
}

// Kitchen data updates
const updateKitchenData = (kitchenData) => {
  if (!campData.value) return
  const current = toRaw(campData.value)
  current.kitchen = { ...kitchenData }
}

// Schedule data updates
const updateScheduleData = (scheduleData) => {
  if (!campData.value) return
  const current = toRaw(campData.value)
  current.schedule = { ...scheduleData }
}

// Camp map updates
const updateCampMap = (mapData) => {
  if (!campData.value) return
  const current = toRaw(campData.value)
  current.camp_map = { ...mapData }
}

// Map placement updates
const updateMapPlacements = (placements) => {
  if (!campData.value) return
  const current = toRaw(campData.value)
  if (!current.camp_map) current.camp_map = {}
  current.camp_map.map_placements = [...placements]
}

// Personal space updates
const handlePersonalSpaceCreate = async (spaceData) => {
  try {
    if (selectedMember.value) {
      await addTeamMember(props.slug, {
        ...selectedMember.value,
        personal_space: spaceData
      })
    }
  } catch (err) {
    console.error('Failed to create personal space:', err)
    showError('Failed to create personal space')
  }
}

const handlePersonalSpaceUpdate = async (spaceData) => {
  try {
    if (selectedMember.value) {
      await updateTeamMember(props.slug, selectedMember.value.id, {
        ...selectedMember.value,
        personal_space: spaceData
      })
    }
  } catch (err) {
    console.error('Failed to update personal space:', err)
    showError('Failed to update personal space')
  }
}

const handlePersonalSpaceDelete = async () => {
  try {
    if (selectedMember.value) {
      await removeTeamMember(selectedMember.value.id)
    }
  } catch (err) {
    console.error('Failed to delete personal space:', err)
    showError('Failed to delete personal space')
  }
}

// Enhanced save functionality using the composable
const saveChanges = async () => {
  try {
    await saveAll()
    const changes = getAllChanges()
    const changeCount = changes.length
    
    if (changeCount > 0) {
      showSuccess(`${changeCount} change${changeCount > 1 ? 's' : ''} saved successfully!`)
    }
  } catch (err) {
    console.error('Failed to save changes:', err)
    showError(err.message || 'Failed to save changes. Please try again.')
  }
}

// Load on mount - APP PATTERN: onMounted() handles initial loading
// This is the consistent pattern across all views in the app:
// - onMounted() for initial data loading
// - watch() without immediate: true for reactive prop changes
onMounted(() => {
  if (props.slug) {
    loadCampData()
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

/* Error states */
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  min-height: 200px;
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