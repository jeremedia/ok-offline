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
            <h2 class="view-title">{{ camp?.name || 'Camp' }} Timeline</h2>
            <p class="view-subtitle">Team arrival and departure schedule</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="scrollable-content">
      <div class="timeline-graph">
        <div v-if="loading" class="loading">
          <div class="loading-text">Loading timeline data...</div>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        
        <div v-else-if="camp" class="graph-container">
          <!-- Date header row -->
          <div class="graph-header">
            <div class="member-column">Team Members</div>
            <div class="dates-column">
              <div v-for="date in dateRange" :key="date" class="date-cell">
                <div class="date-day">{{ formatDay(date) }}</div>
                <div class="date-short">{{ formatDateShort(date) }}</div>
              </div>
            </div>
          </div>
          
          <!-- Member rows -->
          <div class="graph-rows">
            <div v-for="member in sortedMembers" :key="member.id" class="member-row">
              <div class="member-info">
                <div class="member-name">{{ member.display_name || `${member.first_name} ${member.last_name}` }}</div>
                <div class="member-duration">{{ getMemberDuration(member) }}</div>
              </div>
              <div class="member-timeline">
                <div v-for="date in dateRange" :key="date" class="timeline-cell" :class="getCellClass(member, date)">
                  <div v-if="isArrivalDate(member, date)" class="arrival-marker">▶</div>
                  <div v-if="isDepartureDate(member, date)" class="departure-marker">◀</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="graph-legend">
            <div class="legend-item">
              <div class="legend-color on-playa"></div>
              <span>On Playa</span>
            </div>
            <div class="legend-item">
              <div class="legend-marker">▶</div>
              <span>Arrival</span>
            </div>
            <div class="legend-item">
              <div class="legend-marker">◀</div>
              <span>Departure</span>
            </div>
          </div>
        </div>
        
        <div v-else class="no-camp">
          <p>No camp data found</p>
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

// Load camp data
const loadCamp = async (slug) => {
  if (!slug) return
  
  loading.value = true
  error.value = null
  camp.value = null
  
  try {
    camp.value = await getThemeCamp(slug)
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
  router.push(`/${props.year}/camp/${props.slug}`)
}

// Date range computation - Fixed date range from Aug 18 to Sep 2 (PST)
const dateRange = computed(() => {
  const dates = []
  
  // Burning Man 2025: August 18 - September 2 (PST)
  const startDate = new Date(2025, 7, 18, 12, 0, 0) // Aug 18 noon PST
  const endDate = new Date(2025, 8, 2, 12, 0, 0)    // Sep 2 noon PST
  
  // Generate date range
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
})

// Sorted members (camp lead first, then by arrival date)
const sortedMembers = computed(() => {
  if (!camp.value?.team_members) return []
  
  return [...camp.value.team_members].sort((a, b) => {
    // Camp lead first
    if (a.role === 'camp_lead') return -1
    if (b.role === 'camp_lead') return 1
    
    // Then by arrival date (PST comparison)
    if (a.arrival_date && b.arrival_date) {
      const parseDateToPST = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day, 12, 0, 0)
      }
      return parseDateToPST(a.arrival_date) - parseDateToPST(b.arrival_date)
    }
    if (a.arrival_date) return -1
    if (b.arrival_date) return 1
    
    // Finally by name
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
  })
})

// Utility functions - PST timezone handling
const formatDay = (date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    timeZone: 'America/Los_Angeles'
  })
}

const formatDateShort = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric',
    timeZone: 'America/Los_Angeles'
  })
}

const formatRole = (role) => {
  const roleMap = {
    camp_lead: 'Lead',
    veteran: 'Vet',
    virgin: 'Virgin',
    day_visitor: 'Day'
  }
  return roleMap[role] || role
}

const getMemberDuration = (member) => {
  if (!member.arrival_date || !member.departure_date) return 'TBD'
  
  // Parse dates safely in PST
  const parseDateToPST = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0) // noon PST
  }
  
  const arrival = parseDateToPST(member.arrival_date)
  const departure = parseDateToPST(member.departure_date)
  
  // Calculate the difference in days (inclusive of both arrival and departure days)
  const diffTime = departure.getTime() - arrival.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  return `${diffDays} days`
}

const isOnPlaya = (member, date) => {
  if (!member.arrival_date) return false
  
  // Parse member dates safely in PST
  const parseDateToPST = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0) // noon PST
  }
  
  const arrival = parseDateToPST(member.arrival_date)
  const departure = member.departure_date ? parseDateToPST(member.departure_date) : null
  
  // Include both arrival and departure days (<=, not <)
  return date >= arrival && (departure ? date <= departure : true)
}

const isArrivalDate = (member, date) => {
  if (!member.arrival_date) return false
  
  const parseDateToPST = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }
  
  const arrival = parseDateToPST(member.arrival_date)
  return date.getTime() === arrival.getTime()
}

const isDepartureDate = (member, date) => {
  if (!member.departure_date) return false
  
  const parseDateToPST = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day, 12, 0, 0)
  }
  
  const departure = parseDateToPST(member.departure_date)
  return date.getTime() === departure.getTime()
}

const getCellClass = (member, date) => {
  return {
    'on-playa': isOnPlaya(member, date),
    'arrival-day': isArrivalDate(member, date),
    'departure-day': isDepartureDate(member, date)
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
  overflow-x: auto;
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

/* Loading/error states */
.loading {
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
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-error);
}

.no-camp {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

/* Graph container */
.graph-container {
  min-width: 800px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  overflow: hidden;
}

/* Graph header */
.graph-header {
  display: flex;
  background: var(--color-bg-header);
  border-bottom: 2px solid var(--color-border-medium);
  font-weight: 600;
}

.member-column {
  width: 200px;
  padding: 1rem;
  border-right: 1px solid var(--color-border-medium);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.dates-column {
  display: flex;
  flex: 1;
}

.date-cell {
  flex: 1;
  min-width: 60px;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-cell:last-child {
  border-right: none;
}

.date-day {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-short {
  font-size: 0.85rem;
  color: var(--color-text-primary);
}

/* Member rows */
.graph-rows {
  display: flex;
  flex-direction: column;
}

.member-row {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
  padding: 0.5rem 0;
}

.member-row:last-child {
  border-bottom: none;
}

.member-info {
  width: 200px;
  padding: 1.25rem 1rem;
  border-right: 1px solid var(--color-border-medium);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-bg-base);
}

.member-name {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.member-role {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
  align-self: flex-start;
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

.member-duration {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Timeline cells */
.member-timeline {
  display: flex;
  flex: 1;
  align-items: stretch;
}

.timeline-cell {
  flex: 1;
  min-width: 60px;
  min-height: 60px;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--color-bg-elevated);
  padding: 0.25rem;
}

.timeline-cell:last-child {
  border-right: none;
}

.timeline-cell.on-playa {
  background: var(--color-primary-alpha-20);
  border-top: 3px solid var(--color-success);
  border-bottom: 3px solid var(--color-success);
}

.timeline-cell.arrival-day.on-playa {
  border-left: 3px solid var(--color-success);
}

.timeline-cell.departure-day.on-playa {
  border-right: 3px solid var(--color-success);
}

.arrival-marker, .departure-marker {
  font-size: 1rem;
  color: var(--color-success);
  font-weight: bold;
  position: absolute;
}

.arrival-marker {
  left: 0.25rem;
}

.departure-marker {
  right: 0.25rem;
}

/* Legend */
.graph-legend {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: var(--color-bg-header);
  border-top: 1px solid var(--color-border-medium);
  font-size: 0.85rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
}

.legend-color {
  width: 20px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.on-playa {
  background: var(--color-success-alpha-30);
  border: 2px solid var(--color-success);
}

.legend-marker {
  font-weight: bold;
  color: var(--color-success);
}

/* Mobile responsiveness */
@media (max-width: 1024px) {
  .scrollable-content {
    padding: 1rem;
  }
  
  .member-column {
    width: 160px;
  }
  
  .member-info {
    width: 160px;
  }
  
  .date-cell {
    min-width: 50px;
  }
  
  .timeline-cell {
    min-width: 50px;
    min-height: 50px;
  }
}

@media (max-width: 767px) {
  .fixed-header {
    padding: 1rem 1rem 0.5rem;
  }
  
  .scrollable-content {
    padding: 1rem 0.5rem;
  }
  
  .view-title {
    font-size: 1.25rem;
  }
  
  .header-nav {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .graph-legend {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>