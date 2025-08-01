<template>
  <div class="current-conditions">
    <div class="condition-card">
      <div class="dust-level" :class="conditions.dustLevel">
        <span class="dust-icon">{{ getDustIcon(conditions.dustLevel) }}</span>
        <h4>{{ conditions.dustLabel }}</h4>
      </div>
      <div class="metrics">
        <div class="metric">
          <label>Temperature</label>
          <span>
            {{ conditions.temperature }}°F
            <span v-if="getTrend('temperature')" class="trend" :class="getTrendClass('temperature')">
              {{ getTrendIcon('temperature') }}
            </span>
            <small v-if="conditions.feelsLike !== conditions.temperature">
              Feels {{ conditions.feelsLike }}°F
            </small>
          </span>
        </div>
        <div class="metric">
          <label>Wind</label>
          <span>
            {{ conditions.windSpeed }} mph {{ conditions.windDirection }}
            <span v-if="getTrend('windSpeed')" class="trend" :class="getTrendClass('windSpeed')">
              {{ getTrendIcon('windSpeed') }}
            </span>
          </span>
        </div>
        <div class="metric">
          <label>Humidity</label>
          <span>
            {{ conditions.humidity }}%
            <span v-if="getTrend('humidity')" class="trend" :class="getTrendClass('humidity')">
              {{ getTrendIcon('humidity') }}
            </span>
          </span>
        </div>
        <div class="metric">
          <label>Pressure</label>
          <span>{{ conditions.pressure }} hPa</span>
        </div>
        <div v-if="conditions.visibility" class="metric">
          <label>Visibility</label>
          <span>
            {{ conditions.visibility }} mi
            <span v-if="getTrend('visibility')" class="trend" :class="getTrendClass('visibility')">
              {{ getTrendIcon('visibility') }}
            </span>
          </span>
        </div>
      </div>
      <p class="recommendation">{{ conditions.recommendation }}</p>
    </div>
    <div class="update-time" @click="$emit('refresh')" title="Tap to refresh">
      <small>Last Updated: {{ formatCurrentDate() }} @ {{ formatCurrentTime() }}</small>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  conditions: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh'])

const getDustIcon = (level) => {
  const icons = {
    clear: '🌞',
    light: '💨',
    moderate: '🌪️',
    heavy: '🌪️',
    whiteout: '⚠️'
  }
  return icons[level] || '💨'
}

const formatCurrentDate = () => {
  const now = new Date()
  const options = { weekday: 'long', month: 'long', day: 'numeric' }
  return now.toLocaleDateString('en-US', options)
}

const formatCurrentTime = () => {
  const now = new Date()
  const options = { hour: 'numeric', minute: '2-digit' }
  return now.toLocaleTimeString('en-US', options)
}

const getTrend = (metric) => {
  if (!props.conditions.trends || !props.conditions.trends[metric]) {
    return null
  }
  return props.conditions.trends[metric]
}

const getTrendClass = (metric) => {
  const trend = getTrend(metric)
  if (!trend) return ''
  
  // For visibility, up is good
  if (metric === 'visibility') {
    return trend > 0 ? 'trend-up' : 'trend-down'
  }
  
  // For humidity and wind, down is generally better in desert
  if (metric === 'humidity' || metric === 'windSpeed') {
    return trend > 0 ? 'trend-up-bad' : 'trend-down-good'
  }
  
  // For temperature, neutral
  return trend > 0 ? 'trend-up' : 'trend-down'
}

const getTrendIcon = (metric) => {
  // TEMPORARY: Always show up arrow for design purposes
  return '↑'
  
  const trend = getTrend(metric)
  if (!trend) return ''
  
  // Show arrow only if change is significant
  const thresholds = {
    temperature: 1,    // At least 1 degree
    humidity: 2,       // At least 2%
    windSpeed: 2,      // At least 2 mph
    visibility: 0.5    // At least 0.5 miles
  }
  
  if (Math.abs(trend) < (thresholds[metric] || 1)) {
    return ''
  }
  
  return trend > 0 ? '↑' : '↓'
}
</script>

<style scoped>
.current-conditions {
  padding: 0;
}

.condition-card {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

.update-time {
  text-align: center;
  padding: 0.5rem;
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.update-time:hover {
  background-color: var(--color-bg-elevated);
}

.update-time:active {
  background-color: var(--color-bg-header);
}

.dust-level {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
}

/* Desktop dust level styles */
body.desktop-device .dust-level {
  background: transparent;
  border: none;
  justify-content: center;
  padding: 0;
  margin-bottom: 1rem;
}

.dust-icon {
  font-size: 3.75rem;
  line-height: 1;
}

.dust-level h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.875rem;
}

/* Desktop - doubled sizes */
body.desktop-device .dust-icon {
  font-size: 5rem;
}

body.desktop-device .dust-level h4 {
  font-size: 2.5rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Desktop styles for metrics */
body.desktop-device .metrics {
  margin-bottom: 0;
}

body.desktop-device .metric {
  text-align: center;
}

body.desktop-device .metric label {
  text-align: center;
}

body.desktop-device .metric span {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric label {
  font-size: 1.275rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric span {
  color: var(--color-text-primary);
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.2;
}

/* Desktop - doubled sizes */
body.desktop-device .metric label {
  font-size: 1.7rem;
}

body.desktop-device .metric span {
  font-size: 2rem;
}

.metric small {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: normal;
  display: inline;
  margin-left: 0.5rem;
  vertical-align: middle;
}

body.desktop-device .metric small {
  display: inline;
  margin-left: 0.5rem;
  margin-top: 0;
}

body.mobile-device .metric small {
  display: none;
}

body.mobile-device .update-time {
  margin-top: 0;
}

body.mobile-device .condition-card {
  padding-bottom: 0;
}

.recommendation {
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  display: none;
}

/* Dust level colors */
.dust-level.clear {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
}

.dust-level.light {
  background: rgba(255, 193, 7, 0.1);
  border-color: rgba(255, 193, 7, 0.3);
}

.dust-level.moderate {
  background: rgba(255, 152, 0, 0.1);
  border-color: rgba(255, 152, 0, 0.3);
}

.dust-level.heavy {
  background: rgba(244, 67, 54, 0.1);
  border-color: rgba(244, 67, 54, 0.3);
}

.dust-level.whiteout {
  background: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.5);
}

/* Mobile styles */
body.mobile-device .metrics {
  grid-template-columns: 1fr;
  margin-bottom: 1.5rem;
}

body.mobile-device .metric {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 1rem;
}

body.mobile-device .metric label {
  text-align: right;
}

body.mobile-device .metric span {
  text-align: left;
}

body.mobile-device .dust-level {
  justify-content: center;
}

body.mobile-device .dust-icon {
  font-size: 3.75rem;
  transform: scale(1.5);
}

/* Trend indicators */
.trend {
  display: inline-flex;
  align-items: center;
  font-weight: bold;
  font-size: 1.35rem;
  line-height: 1;
}

/* Desktop - doubled size */
body.desktop-device .trend {
  font-size: 1.8rem;
}

.trend-up {
  color: var(--color-danger);
}

.trend-down {
  color: var(--color-primary);
}

.trend-up-bad {
  color: var(--color-warning);
}

.trend-down-good {
  color: var(--color-success);
}
</style>