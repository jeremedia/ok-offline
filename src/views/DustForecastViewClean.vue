<template>
  <div class="view-container">
    <section>
      <div class="view-header">
        <h2>BRC Weather & Sky</h2>
      </div>
    
      <div class="content-wrapper">
        <!-- Loading State -->
        <div v-if="isLoading && !currentConditions" key="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Fetching latest weather data...</p>
        </div>
        
        <!-- Weather Data -->
        <div v-else-if="currentConditions" key="weather" class="weather-container">
          <Accordion :multiple="true">
            <!-- Current Conditions -->
            <AccordionItem 
              title="CURRENT CONDITIONS"
              storage-key="weather_current"
              :default-open="true"
            >
              <CurrentConditionsSection :conditions="currentConditions" @refresh="refreshWeather" />
            </AccordionItem>
            
            <!-- Light Cycle -->
            <AccordionItem
              v-if="currentConditions.twilightTimes"
              title="LIGHT CYCLE"
              storage-key="weather_light"
              :default-open="true"
            >
              <LightCycleSection 
                :twilight-times="currentConditions.twilightTimes"
                :sun-times="sunTimes"
                :forecast-days="forecastDays"
              />
            </AccordionItem>
            
            <!-- 5-Day Forecast -->
            <AccordionItem
              v-if="forecastDays && forecastDays.length"
              title="5-DAY FORECAST"
              storage-key="weather_forecast"
              :default-open="true"
            >
              <div class="forecast-section">
                <div class="forecast-grid">
                  <div 
                    v-for="day in forecastDays" 
                    :key="day.dateIso" 
                    class="forecast-day"
                  >
                    <h5>{{ day.dayName }}</h5>
                    <span class="forecast-icon">{{ getDustIcon(day.dustLevel) }}</span>
                    <p class="forecast-level">{{ day.dustLabel }}</p>
                    <div class="temp-range">
                      <span class="temp-high">{{ day.temperature.high }}°</span>
                      <span class="temp-low">{{ day.temperature.low }}°</span>
                    </div>
                    <small>Wind: {{ day.windSpeed }} mph {{ day.windDirection }}</small>
                    <small class="humidity">{{ day.humidity }}% humidity</small>
                  </div>
                </div>
              </div>
            </AccordionItem>
            
            <!-- Moon Phase -->
            <AccordionItem
              v-if="currentConditions.moonPhase"
              title="🌙 MOON PHASE"
              storage-key="weather_moon"
              :default-open="true"
            >
              <div class="moon-phase-section">
                <div class="moon-phase-card">
                  <div class="moon-display">
                    <span class="moon-icon">{{ currentConditions.moonPhase.phaseIcon }}</span>
                    <h4>{{ currentConditions.moonPhase.phaseName }}</h4>
                  </div>
                  <div class="moon-times" v-if="currentConditions.moonPhase.moonrise">
                    <div class="moon-time">
                      <label>Moonrise</label>
                      <span>{{ currentConditions.moonPhase.moonrise }}</span>
                    </div>
                    <div class="moon-time">
                      <label>Moonset</label>
                      <span>{{ currentConditions.moonPhase.moonset }}</span>
                    </div>
                  </div>
                  <p class="moon-info">
                    Moon phases are crucial for navigation and activities at Burning Man. 
                    <strong>{{ currentConditions.moonPhase.phaseName }}</strong> provides 
                    {{ getMoonLightDescription(currentConditions.moonPhase.phase) }} for nighttime visibility.
                  </p>
                </div>
              </div>
            </AccordionItem>
            
            <!-- Dust Protection Tips -->
            <AccordionItem
              title="DUST PROTECTION TIPS"
              storage-key="weather_tips"
              :default-open="false"
            >
              <div class="dust-tips">
                <div class="tips-grid">
                  <div class="tip-card">
                    <h4>🥽 Eye Protection</h4>
                    <p>Always wear goggles during dust storms. Regular sunglasses won't protect from fine playa dust.</p>
                  </div>
                  <div class="tip-card">
                    <h4>😷 Breathing Protection</h4>
                    <p>N95 masks or better for heavy dust. Bandanas won't cut it when the whiteouts hit.</p>
                  </div>
                  <div class="tip-card">
                    <h4>🧴 Skin Care</h4>
                    <p>Moisturize frequently! Playa dust is extremely alkaline and will dry out your skin.</p>
                  </div>
                  <div class="tip-card">
                    <h4>🏕️ Camp Setup</h4>
                    <p>Stake everything down! Secure loose items before dust storms hit.</p>
                  </div>
                </div>
              </div>
            </AccordionItem>
            
            <!-- Dust Level Scale -->
            <AccordionItem
              title="DUST LEVEL SCALE"
              storage-key="weather_scale"
              :default-open="false"
            >
              <div class="dust-scale">
                <div class="scale-items">
                  <div class="scale-item clear">
                    <span>🌞</span>
                    <strong>Clear</strong>
                    <small>Minimal dust, great visibility</small>
                  </div>
                  <div class="scale-item light">
                    <span>💨</span>
                    <strong>Light</strong>
                    <small>Some dust in the air, visibility good</small>
                  </div>
                  <div class="scale-item moderate">
                    <span>🌪️</span>
                    <strong>Moderate</strong>
                    <small>Reduced visibility, masks recommended</small>
                  </div>
                  <div class="scale-item heavy">
                    <span>🌪️</span>
                    <strong>Heavy</strong>
                    <small>Low visibility, full protection needed</small>
                  </div>
                  <div class="scale-item whiteout">
                    <span>⚠️</span>
                    <strong>Whiteout</strong>
                    <small>Near-zero visibility, shelter immediately</small>
                  </div>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          
          <!-- Data Source Info -->
          <div class="data-source">
            <small v-if="currentConditions.source === 'cache-expired'">
              ⚠️ Using cached data (offline)
            </small>
            <small v-else-if="currentConditions.source === 'cache'">
              📱 Cached data • Updated {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
            <small v-else-if="currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired'">
              🍎 Apple WeatherKit • {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
            <small v-else>
              🌐 OpenWeatherMap • {{ formatUpdateTime(currentConditions.lastUpdated) }}
            </small>
          </div>
          
          <!-- Apple Weather Attribution -->
          <div v-if="currentConditions && (currentConditions.source === 'apple-api' || currentConditions.source === 'apple-cache-expired' || currentConditions.moonPhase)" class="global-attribution">
            <small>
              <a href="https://developer.apple.com/weatherkit/data-source-attribution/" target="_blank" rel="noopener">
                Weather data provided by Apple WeatherKit
              </a>
            </small>
          </div>
        </div>
        
        <!-- No Data State -->
        <div v-else key="no-data" class="no-data-state">
          <div class="no-data-content">
            <span class="no-data-icon">🌤️</span>
            <h3>Weather Data Unavailable</h3>
            <p>Waiting for weather data to load...</p>
            <button @click="refreshWeather" class="retry-btn">Try Loading Weather!</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getCurrentWeatherRobust, getWeatherForecastRobust, getSunTimesRobust } from '../services/weatherServiceCombined'
import { useToast } from '../composables/useToast'
import { Accordion, AccordionItem } from '../components/ui'
import { CurrentConditionsSection, LightCycleSection } from '../components/weather'

const { showError, showSuccess } = useToast()

// Reactive state
const currentConditions = ref(null)
const forecastDays = ref([])
const sunTimes = ref(null)
const isLoading = ref(false)
const error = ref(null)

// Auto-refresh interval
let autoRefreshInterval = null
const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000 // 15 minutes

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

const getMoonLightDescription = (phase) => {
  if (!phase) return 'natural lighting'
  
  if (phase === 0 || phase === 1) {
    return 'minimal light - perfect for stargazing but bring extra lighting'
  } else if (phase > 0.4 && phase < 0.6) {
    return 'excellent light'
  } else if (phase > 0.9) {
    return 'bright moonlight'
  } else {
    return 'moderate light'
  }
}

const formatUpdateTime = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}

const loadWeatherData = async (showLoadingIndicator = true) => {
  if (showLoadingIndicator && !currentConditions.value) {
    isLoading.value = true
  }
  error.value = null
  
  try {
    // Load current conditions and forecast in parallel
    const [current, forecast, sun] = await Promise.allSettled([
      getCurrentWeatherRobust(),
      getWeatherForecastRobust(),
      getSunTimesRobust()
    ])
    
    // Handle current conditions
    if (current.status === 'fulfilled') {
      currentConditions.value = current.value
      console.log('Weather data loaded:', current.value)
    } else {
      console.error('Failed to load current conditions:', current.reason)
      showError('Unable to load current weather conditions')
    }
    
    // Handle forecast
    if (forecast.status === 'fulfilled') {
      forecastDays.value = forecast.value
    } else {
      console.error('Failed to load forecast:', forecast.reason)
    }
    
    // Handle sun times
    if (sun.status === 'fulfilled') {
      sunTimes.value = sun.value
    } else {
      console.error('Failed to load sun times:', sun.reason)
    }
    
    // Show success message
    if (current.status === 'fulfilled' && !showLoadingIndicator) {
      showSuccess('Weather data refreshed')
    }
    
  } catch (err) {
    console.error('Weather loading error:', err)
    error.value = err.message || 'Failed to load weather data'
    showError('Unable to connect to weather service')
  } finally {
    isLoading.value = false
  }
}

const refreshWeather = async () => {
  await loadWeatherData(false)
}

const startAutoRefresh = () => {
  // Clear any existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  
  // Set up auto-refresh every 15 minutes
  autoRefreshInterval = setInterval(() => {
    console.log('Auto-refreshing weather data...')
    loadWeatherData(false)
  }, AUTO_REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
  }
}

onMounted(async () => {
  console.log('Dust forecast view mounted')
  await loadWeatherData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

section {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.view-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-medium);
  flex-shrink: 0;
}

.view-header h2 {
  margin: 0;
  color: var(--color-text-primary);
}

.weather-container {
  padding: 2rem;
}

/* Loading and error states */
.loading-state,
.no-data-state {
  padding: 3rem 1.5rem;
  text-align: center;
}


.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-data-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

/* Forecast section */
.forecast-section {
  padding: 1rem 1.5rem;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.forecast-day {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.forecast-day h5 {
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.forecast-icon {
  font-size: 2rem;
  display: block;
  margin: 0.5rem 0;
}

.forecast-level {
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0.5rem 0;
}

.temp-range {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 0.5rem 0;
}

.temp-high {
  color: var(--color-danger);
}

.temp-low {
  color: var(--color-primary);
}

.forecast-day small {
  color: var(--color-text-muted);
  display: block;
  margin-top: 0.25rem;
}

.humidity {
  font-size: 0.8rem !important;
}

/* Moon Phase Section */
.moon-phase-section {
  padding: 1rem 1.5rem;
}

.moon-phase-card {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
}

.moon-display {
  margin-bottom: 1.5rem;
}

.moon-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 0.5rem;
}

.moon-display h4 {
  color: var(--color-text-primary);
  margin: 0;
  font-size: 1.25rem;
}

.moon-times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
}

.moon-time {
  text-align: center;
}

.moon-time label {
  display: block;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.25rem;
}

.moon-time span {
  color: var(--color-text-primary);
  font-weight: 500;
}

.moon-info {
  color: var(--color-text-secondary);
  margin: 1rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Dust Tips Section */
.dust-tips {
  padding: 1rem 1.5rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.tip-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.5rem;
}

.tip-card h4 {
  color: var(--color-text-primary);
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
}

.tip-card p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

/* Dust Scale Section */
.dust-scale {
  padding: 1rem 1.5rem;
}

.scale-items {
  display: grid;
  gap: 0.75rem;
}

.scale-item {
  display: grid;
  grid-template-columns: 3rem 1fr 2fr;
  align-items: center;
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
}

.scale-item span {
  font-size: 1.5rem;
  text-align: center;
}

.scale-item strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.scale-item small {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

/* Data source and attribution */
.data-source {
  margin: 1rem 0;
  padding: 0.75rem;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  text-align: center;
}

.data-source small {
  color: var(--color-text-secondary);
}

.global-attribution {
  text-align: center;
  margin: 1rem 0;
  padding: 0.5rem;
}

.global-attribution a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.85rem;
}

.global-attribution a:hover {
  color: var(--color-text-muted);
  text-decoration: underline;
}

/* Mobile adjustments */
body.mobile-device .weather-container {
  padding: 1rem;
}

body.mobile-device .forecast-grid {
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}

body.mobile-device .forecast-day {
  padding: 0.75rem;
}

body.mobile-device .tips-grid {
  grid-template-columns: 1fr;
}
</style>