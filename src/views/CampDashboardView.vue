<template>
  <div class="view-container">
    <div class="fixed-header">
      <div class="header-section">
        <div class="header-nav">
          <div class="header-titles">
            <h2 class="view-title">OKNOTOK Camp Management</h2>
            <p class="view-subtitle">Team coordination for Burning Man 2025</p>
          </div>
          <div class="header-actions">
            <BaseButton 
              variant="secondary" 
              size="sm" 
              @click="navigateToEditor"
              class="edit-camp-btn"
            >
              ✏️ Edit Camp
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
    
    <div class="scrollable-content">
      <div class="camp-dashboard">
        <div v-if="loading" class="loading">
          <div class="loading-text">Loading camp data...</div>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <p class="error-details">Check console for more details</p>
        </div>
        
        <div v-else-if="camp" class="camp-content">
          <div class="camp-header">
            <h3>{{ camp.name }}</h3>
            <div class="camp-details">
              <p class="camp-year">{{ camp.year || year }}</p>
              <p class="camp-slug">{{ slug }}</p>
              <p v-if="camp.description" class="camp-description">{{ camp.description }}</p>
            </div>
          </div>
          
          <div class="dashboard-sections">
            <div class="section-card">
              <h4>Team Members ({{ camp.team_members?.length || 0 }})</h4>
              <div v-if="camp.team_members && camp.team_members.length > 0" class="team-members">
                <div v-for="member in sortedTeamMembers" :key="member.id" class="member-card">
                  <div class="member-header">
                    <h5 class="member-name">{{ member.display_name || `${member.first_name} ${member.last_name}` }}</h5>
                  </div>
                  <div class="member-dates">
                    <div class="date-info">
                      <span class="date-label">Arrives:</span>
                      <span class="date-value">{{ formatDate(member.arrival_date) }}</span>
                    </div>
                    <div class="date-info">
                      <span class="date-label">Departs:</span>
                      <span class="date-value">{{ formatDate(member.departure_date) || 'TBD' }}</span>
                    </div>
                    <div v-if="member.arrival_date && member.departure_date" class="duration">
                      {{ calculateDuration(member.arrival_date, member.departure_date) }} days
                    </div>
                  </div>
                  <div v-if="member.skills" class="member-skills">
                    <span class="skills-label">Skills:</span>
                    <span class="skills-value">{{ member.skills }}</span>
                  </div>
                  <div v-if="member.dietary_restrictions && member.dietary_restrictions !== 'None specified'" class="member-diet">
                    <span class="diet-label">Diet:</span>
                    <span class="diet-value">{{ member.dietary_restrictions }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="no-members">No team members found</p>
            </div>
            
            <!-- Wallpaper Builder Section -->
            <div class="section-card">
              <h4>Team Wallpapers</h4>
              <p class="section-description">Create personalized phone wallpapers for team members</p>
              <div class="wallpaper-actions">
                <BaseButton 
                  variant="primary" 
                  size="md"
                  @click="showWallpaperBuilder = true"
                  class="wallpaper-btn"
                >
                  🎨 Create Wallpaper
                </BaseButton>
                <p class="wallpaper-info">Generate custom home screens with camp info and member names</p>
              </div>
            </div>
            
            <div class="section-card">
              <div class="timeline-header">
                <h4>Arrive & Depart</h4>
                <BaseButton 
                  variant="secondary" 
                  size="sm" 
                  @click="navigateToTimeline"
                  class="timeline-graph-btn"
                >
                  📊 Graph View
                </BaseButton>
              </div>
              <div v-if="arrivalTimeline.length > 0" class="timeline">
                <div v-for="day in arrivalTimeline" :key="day.date" class="timeline-day">
                  <div class="timeline-date">{{ formatDate(day.date) }}</div>
                  <div class="timeline-events">
                    <!-- Arrivals -->
                    <div v-if="day.arrivals && day.arrivals.length > 0" class="timeline-section arrivals">
                      <span class="timeline-label">🆗 Arrive:</span>
                      <div class="timeline-members">
                        <span v-for="member in day.arrivals" :key="`arr-${member.id}`" class="timeline-member">
                          {{ member.playa_name || member.first_name }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Departures -->
                    <div v-if="day.departures && day.departures.length > 0" class="timeline-section departures">
                      <span class="timeline-label">🚫 Depart:</span>
                      <div class="timeline-members">
                        <span v-for="member in day.departures" :key="`dep-${member.id}`" class="timeline-member">
                          {{ member.playa_name || member.first_name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else>No arrival dates set</p>
            </div>
            
            <div class="section-card">
              <h4>Announcements</h4>
              <p>Coming soon...</p>
            </div>
          </div>
        </div>
        
        <div v-else class="no-camp">
          <p>No camp data found</p>
          <p class="camp-slug-info">Looking for camp: {{ slug }}</p>
        </div>
      </div>
    </div>
    
    <!-- Wallpaper Builder Modal -->
    <div v-if="showWallpaperBuilder" class="modal-overlay" @click="closeWallpaperBuilder">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h2>Create Team Wallpaper</h2>
          <button class="modal-close" @click="closeWallpaperBuilder">✕</button>
        </div>
        <div class="modal-body">
          <WallpaperBuilder 
            :camp-data="{
              name: camp?.name || 'OKNOTOK',
              location: campLocation
            }"
            @close="closeWallpaperBuilder"
          />
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
import WallpaperBuilder from '../components/camp-editor/WallpaperBuilder.vue'

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
const showWallpaperBuilder = ref(false)

// Real camp data loading following DetailView pattern
const loadCamp = async (slug) => {
  if (!slug) return
  
  loading.value = true
  error.value = null
  camp.value = null
  
  try {
    console.log('Loading camp data for slug:', slug)
    camp.value = await getThemeCamp(slug)
    console.log('Camp loaded successfully:', camp.value)
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

// Load on mount
onMounted(() => {
  if (props.slug) {
    loadCamp(props.slug)
  }
})

// Computed camp location - for 2025 it's at 3:30 & A
const campLocation = computed(() => {
  // OKNOTOK is at 3:30 & A for 2025
  if (props.slug === 'oknotok' || camp.value?.name === 'OKNOTOK') {
    return '3:30 & A'
  }
  return camp.value?.location || 'Location TBD'
})

// Computed properties for team member display
const sortedTeamMembers = computed(() => {
  if (!camp.value?.team_members) return []
  
  return [...camp.value.team_members].sort((a, b) => {
    // Camp lead first
    if (a.role === 'camp_lead') return -1
    if (b.role === 'camp_lead') return 1
    
    // Then by arrival date
    if (a.arrival_date && b.arrival_date) {
      return new Date(a.arrival_date) - new Date(b.arrival_date)
    }
    if (a.arrival_date) return -1
    if (b.arrival_date) return 1
    
    // Finally by name
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  })
})

const arrivalTimeline = computed(() => {
  if (!camp.value?.team_members) return []
  
  const timeline = {}
  
  // Add arrival entries
  camp.value.team_members.forEach(member => {
    if (member.arrival_date) {
      const date = member.arrival_date
      if (!timeline[date]) {
        timeline[date] = { arrivals: [], departures: [] }
      }
      timeline[date].arrivals.push(member)
    }
  })
  
  // Add departure entries
  camp.value.team_members.forEach(member => {
    if (member.departure_date) {
      const date = member.departure_date
      if (!timeline[date]) {
        timeline[date] = { arrivals: [], departures: [] }
      }
      timeline[date].departures.push(member)
    }
  })
  
  // Filter out dates with no events and sort
  return Object.entries(timeline)
    .filter(([date, events]) => events.arrivals.length > 0 || events.departures.length > 0)
    .map(([date, events]) => ({ date, ...events }))
    .sort((a, b) => {
      // Safe date comparison in PST
      const parseDateToPST = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day, 12, 0, 0)
      }
      return parseDateToPST(a.date) - parseDateToPST(b.date)
    })
})

// Utility functions - PST timezone handling
const formatDate = (dateString) => {
  if (!dateString) return null
  
  // Parse date safely and display in PST (America/Los_Angeles)
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12, 0, 0) // Use noon to avoid DST issues
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    timeZone: 'America/Los_Angeles' // Force PST/PDT display
  })
}

const formatRole = (role) => {
  const roleMap = {
    camp_lead: 'Camp Lead',
    veteran: 'Veteran',
    virgin: 'Virgin',
    day_visitor: 'Day Visitor'
  }
  return roleMap[role] || role
}

const calculateDuration = (arrivalDate, departureDate) => {
  if (!arrivalDate || !departureDate) return null
  
  // Parse dates safely in PST
  const parseDateToPST = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }
  
  const arrival = parseDateToPST(arrivalDate)
  const departure = parseDateToPST(departureDate)
  const diffTime = departure.getTime() - arrival.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

// Navigation functions
const navigateToTimeline = () => {
  router.push(`/${props.year}/camp/${props.slug}/timeline`)
}

const navigateToEditor = () => {
  router.push(`/${props.year}/camp/${props.slug}/edit`)
}

// Wallpaper builder functions
const closeWallpaperBuilder = () => {
  showWallpaperBuilder.value = false
}
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
  padding: 2rem 2rem 2rem;
}

/* Header styling following ListView pattern */
.header-section {
  margin-bottom: 1rem;
}

.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.header-titles {
  flex: 1;
}

.header-actions {
  flex-shrink: 0;
  margin-top: 0.25rem; /* Align with title */
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

/* Loading/error states following existing patterns */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loading-text {
  color: var(--color-text-secondary);
}

.error {
  text-align: center;
  padding: 2rem;
  color: var(--color-error);
}

.error-details {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.no-camp {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}

.camp-slug-info {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* Camp content */
.camp-header {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
}

.camp-header h3 {
  color: var(--color-accent);
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}

.camp-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.camp-year {
  color: var(--color-primary);
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.camp-slug {
  color: var(--color-text-muted);
  margin: 0;
  font-size: 0.85rem;
}

.camp-description {
  color: var(--color-text-secondary);
  margin: 0.5rem 0 0 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Dashboard sections */
.dashboard-sections {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

.section-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  padding: 1.5rem;
  transition: border-color 0.2s;
}

.section-card:hover {
  border-color: var(--color-border-heavy);
}

.section-card h4 {
  color: var(--color-accent);
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.section-card p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* Desktop layout */
@media (min-width: 768px) {
  .dashboard-sections {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .fixed-header {
    padding: 2rem 2rem 1rem;
  }
}

/* Team member styles */
.team-members {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 1rem;
  transition: border-color 0.2s;
}

.member-card:hover {
  border-color: var(--color-border-medium);
}

.member-header {
  margin-bottom: 0.75rem;
}

.member-name {
  color: var(--color-accent);
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.member-role {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.role-camp_lead {
  background: var(--color-primary-alpha-20);
  color: var(--color-primary);
}

.role-veteran {
  background: var(--color-success-alpha-20);
  color: var(--color-success);
}

.role-virgin {
  background: var(--color-warning-alpha-20);
  color: var(--color-warning);
}

.role-day_visitor {
  background: var(--color-purple-alpha-20);
  color: var(--color-purple);
}

.member-dates {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1rem;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 4px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.date-value {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.duration {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.member-skills, .member-diet {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.member-skills:last-child, .member-diet:last-child {
  margin-bottom: 0;
}

.skills-label, .diet-label {
  color: var(--color-text-muted);
  font-weight: 500;
  min-width: 50px;
}

.skills-value, .diet-value {
  color: var(--color-text-secondary);
}

.no-members {
  color: var(--color-text-muted);
  text-align: center;
  padding: 1rem;
  margin: 0;
}

/* Timeline styles */
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timeline-header h4 {
  margin: 0;
}

.timeline-graph-btn {
  flex-shrink: 0;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timeline-day {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
}

.timeline-date {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-primary);
  width: 100%;
  text-align: left;
  padding: 0 0 0.5rem 0;
  border-bottom: 1px dotted var(--color-border-medium);
}

.timeline-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.timeline-events {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.timeline-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.timeline-section.arrivals .timeline-label {
  color: var(--color-success);
}

.timeline-section.departures .timeline-label {
  color: var(--color-warning);
}

.timeline-label {
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 70px;
  flex-shrink: 0;
}

.timeline-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex: 1;
}

.timeline-member {
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-elevated);
  border-radius: 12px;
  color: var(--color-text-secondary);
}

/* Mobile responsiveness */
@media (max-width: 767px) {
  .fixed-header {
    padding: 1rem 1rem 0.5rem;
  }
  
  .scrollable-content {
    padding: 1rem 1rem 1rem;
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
    margin-top: 0;
  }
  
  .member-dates {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .duration {
    justify-content: center;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-light);
  }
  
  .timeline-day {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .timeline-date {
    min-width: auto;
  }
}

/* Wallpaper Section Styles */
.section-description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.wallpaper-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

.wallpaper-btn {
  font-size: 1rem;
}

.wallpaper-info {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: var(--color-bg-base);
  border-radius: 12px;
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-medium);
  background: var(--color-bg-elevated);
}

.modal-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
  }
}
</style>