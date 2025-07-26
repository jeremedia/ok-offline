<template>
  <section id="dust-forecast-section" class="view">
    <h2>Playa Dust Forecast</h2>
    
    <div class="forecast-container">
      <div class="current-conditions">
        <h3>Current Conditions</h3>
        <div class="condition-card">
          <div class="dust-level" :class="currentConditions.level">
            <span class="dust-icon">{{ getDustIcon(currentConditions.level) }}</span>
            <h4>{{ currentConditions.label }}</h4>
          </div>
          <div class="metrics">
            <div class="metric">
              <label>Wind Speed</label>
              <span>{{ currentConditions.windSpeed }} mph</span>
            </div>
            <div class="metric">
              <label>Wind Direction</label>
              <span>{{ currentConditions.windDirection }}</span>
            </div>
            <div class="metric">
              <label>Visibility</label>
              <span>{{ currentConditions.visibility }}</span>
            </div>
          </div>
          <p class="recommendation">{{ currentConditions.recommendation }}</p>
        </div>
      </div>
      
      <div class="forecast-days">
        <h3>5-Day Forecast</h3>
        <div class="forecast-grid">
          <div 
            v-for="day in forecastDays" 
            :key="day.date" 
            class="forecast-day"
          >
            <h5>{{ day.dayName }}</h5>
            <span class="forecast-icon">{{ getDustIcon(day.level) }}</span>
            <p class="forecast-level">{{ day.label }}</p>
            <small>Wind: {{ day.windSpeed }} mph</small>
          </div>
        </div>
      </div>
      
      <div class="dust-tips">
        <h3>Dust Protection Tips</h3>
        <div class="tips-grid">
          <div class="tip-card">
            <h4>🥽 Eye Protection</h4>
            <p>Always wear goggles during dust storms. Regular sunglasses won't protect from fine playa dust.</p>
          </div>
          <div class="tip-card">
            <h4>😷 Breathing Protection</h4>
            <p>Use N95 masks or dust masks. Bandanas provide minimal protection against alkaline dust.</p>
          </div>
          <div class="tip-card">
            <h4>🧴 Skin Care</h4>
            <p>Apply vinegar solution (1:4 with water) to neutralize alkaline dust on skin.</p>
          </div>
          <div class="tip-card">
            <h4>🏕️ Camp Setup</h4>
            <p>Stake everything down! Secure loose items before dust storms hit.</p>
          </div>
        </div>
      </div>
      
      <div class="dust-scale">
        <h3>Dust Level Scale</h3>
        <div class="scale-items">
          <div class="scale-item clear">
            <span>🌞</span>
            <strong>Clear</strong>
            <small>Minimal dust, great visibility</small>
          </div>
          <div class="scale-item light">
            <span>🌤️</span>
            <strong>Light Dust</strong>
            <small>Some haze, good visibility</small>
          </div>
          <div class="scale-item moderate">
            <span>🌫️</span>
            <strong>Moderate</strong>
            <small>Noticeable dust, mask recommended</small>
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
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Mock data - in a real app, this would come from a weather API
const currentConditions = ref({
  level: 'moderate',
  label: 'Moderate Dust',
  windSpeed: 15,
  windDirection: 'SW',
  visibility: 'Reduced',
  recommendation: 'Dust mask recommended. Secure loose items in camp.'
})

const forecastDays = ref([
  { 
    date: '2025-08-26', 
    dayName: 'Tue',
    level: 'light',
    label: 'Light Dust',
    windSpeed: 10
  },
  { 
    date: '2025-08-27', 
    dayName: 'Wed',
    level: 'moderate',
    label: 'Moderate',
    windSpeed: 18
  },
  { 
    date: '2025-08-28', 
    dayName: 'Thu',
    level: 'clear',
    label: 'Clear',
    windSpeed: 5
  },
  { 
    date: '2025-08-29', 
    dayName: 'Fri',
    level: 'heavy',
    label: 'Heavy Dust',
    windSpeed: 25
  },
  { 
    date: '2025-08-30', 
    dayName: 'Sat',
    level: 'moderate',
    label: 'Moderate',
    windSpeed: 15
  }
])

const getDustIcon = (level) => {
  const icons = {
    clear: '🌞',
    light: '🌤️',
    moderate: '🌫️',
    heavy: '🌪️',
    whiteout: '⚠️'
  }
  return icons[level] || '🌫️'
}

// In a real app, you might fetch weather data here
onMounted(() => {
  console.log('Dust forecast view mounted')
  // Could fetch real weather data from an API
})
</script>

<style scoped>
#dust-forecast-section {
  padding: 1rem;
  max-width: 1000px;
  margin: 0 auto;
}

h2 {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.forecast-container {
  display: grid;
  gap: 2rem;
}

.current-conditions {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.current-conditions h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.condition-card {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
}

.dust-level {
  text-align: center;
  margin-bottom: 1.5rem;
}

.dust-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.dust-level h4 {
  color: #fff;
  margin: 0;
  font-size: 1.5rem;
}

.dust-level.clear { color: #4CAF50; }
.dust-level.light { color: #FFC107; }
.dust-level.moderate { color: #FF9800; }
.dust-level.heavy { color: #FF5722; }
.dust-level.whiteout { color: #F44336; }

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  text-align: center;
}

.metric label {
  display: block;
  color: #999;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.metric span {
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
}

.recommendation {
  color: #ccc;
  text-align: center;
  margin: 0;
  padding: 1rem;
  background: #333;
  border-radius: 4px;
}

.forecast-days {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.forecast-days h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.forecast-day {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.forecast-day h5 {
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.forecast-icon {
  font-size: 2rem;
  display: block;
  margin: 0.5rem 0;
}

.forecast-level {
  color: #ccc;
  margin: 0.5rem 0;
}

.forecast-day small {
  color: #999;
}

.dust-tips {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.dust-tips h3 {
  color: #fff;
  margin-bottom: 1rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.tip-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
}

.tip-card h4 {
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.tip-card p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
}

.dust-scale {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
}

.dust-scale h3 {
  color: #fff;
  margin-bottom: 1rem;
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
  background: #2a2a2a;
  border-radius: 4px;
}

.scale-item span {
  font-size: 1.5rem;
}

.scale-item strong {
  color: #fff;
}

.scale-item small {
  color: #999;
  text-align: right;
}

.scale-item.clear { border-left: 4px solid #4CAF50; }
.scale-item.light { border-left: 4px solid #FFC107; }
.scale-item.moderate { border-left: 4px solid #FF9800; }
.scale-item.heavy { border-left: 4px solid #FF5722; }
.scale-item.whiteout { border-left: 4px solid #F44336; }

@media (max-width: 768px) {
  .metrics {
    grid-template-columns: 1fr;
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
  
  .scale-item {
    grid-template-columns: 3rem 1fr;
  }
  
  .scale-item small {
    grid-column: 2;
    text-align: left;
    margin-top: 0.25rem;
  }
}
</style>