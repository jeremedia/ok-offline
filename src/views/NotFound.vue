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
  color: var(--color-accent);
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  margin: 0 0 2rem 0;
}

.current-path {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: left;
  word-break: break-all;
}

.path-label {
  color: var(--color-text-muted);
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.current-path code {
  color: var(--color-accent);
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.95rem;
}

.suggestions {
  margin: 2rem 0;
}

.suggestions h3 {
  color: var(--color-text-primary);
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
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  text-decoration: none;
  color: var(--color-text-primary);
  text-align: left;
  transition: all 0.2s;
}

.link-card:hover {
  background: var(--color-bg-header);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.link-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.link-card strong {
  color: var(--color-accent);
  display: block;
  margin-bottom: 0.25rem;
}

.link-card p {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.home-button {
  margin-top: 2rem;
}

.primary-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background: var(--color-primary-dark);
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