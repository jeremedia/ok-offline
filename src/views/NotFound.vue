<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">🔥</div>
      <h1>Lost in the Dust?</h1>
      <p class="error-message">The page you're looking for doesn't exist.</p>
      
      <div class="current-path">
        <span class="path-label">Requested path:</span>
        <code>{{ currentPath }}</code>
      </div>
      
      <div class="suggestions">
        <h3>Here are some helpful places to go:</h3>
        <div class="quick-links">
          <router-link :to="`/${selectedYear}/map`" class="link-card">
            <span class="link-icon">🗺️</span>
            <div>
              <strong>Map View</strong>
              <p>Explore camps, art, and events on the playa</p>
            </div>
          </router-link>
          
          <router-link :to="`/${selectedYear}/search`" class="link-card">
            <span class="link-icon">🔍</span>
            <div>
              <strong>Search</strong>
              <p>Find what you're looking for</p>
            </div>
          </router-link>
          
          <router-link to="/settings" class="link-card">
            <span class="link-icon">⚙️</span>
            <div>
              <strong>Settings</strong>
              <p>Sync data or configure the app</p>
            </div>
          </router-link>
          
          <router-link :to="`/${selectedYear}/schedule`" class="link-card">
            <span class="link-icon">📅</span>
            <div>
              <strong>My Schedule</strong>
              <p>View your personal burn schedule</p>
            </div>
          </router-link>
        </div>
      </div>
      
      <div class="home-button">
        <button @click="goHome" class="primary-button">
          🏠 Go to Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Get the current path that led to 404
const currentPath = computed(() => route.fullPath)

// Get selected year from localStorage
const selectedYear = computed(() => {
  return localStorage.getItem('selectedYear') || '2025'
})

// Navigate to home (map view)
const goHome = () => {
  router.push(`/${selectedYear.value}/map`)
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px); /* Account for header/footer */
  padding: 2rem;
}

.not-found-content {
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: flicker 3s infinite;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

h1 {
  color: #FFD700;
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.error-message {
  color: #ccc;
  font-size: 1.2rem;
  margin: 0 0 2rem 0;
}

.current-path {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  word-break: break-all;
}

.path-label {
  color: #999;
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.current-path code {
  color: #FFD700;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.95rem;
}

.suggestions {
  margin: 2rem 0;
}

.suggestions h3 {
  color: #fff;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  text-decoration: none;
  color: #fff;
  text-align: left;
  transition: all 0.2s;
}

.link-card:hover {
  background: #333;
  border-color: #8B0000;
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.link-card strong {
  color: #FFD700;
  display: block;
  margin-bottom: 0.25rem;
}

.link-card p {
  color: #ccc;
  margin: 0;
  font-size: 0.9rem;
}

.home-button {
  margin-top: 2rem;
}

.primary-button {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background: #a00;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .not-found-container {
    min-height: calc(100vh - 100px);
    padding: 1rem;
  }
  
  .error-icon {
    font-size: 3rem;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  .quick-links {
    grid-template-columns: 1fr;
  }
  
  .link-card {
    padding: 0.75rem;
  }
}
</style>