import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import views
import MapView from './views/MapView.vue'
import ListView from './views/ListView.vue'
import DetailView from './views/DetailView.vue'
import SettingsView from './views/SettingsView.vue'
import MapSettingsView from './views/MapSettingsView.vue'
import SearchView from './views/SearchView.vue'
import ScheduleView from './views/ScheduleView.vue'
import DustForecastView from './views/DustForecastView.vue'
import ResetView from './views/ResetView.vue'

// Import CSS
import '/style.css'
import 'leaflet/dist/leaflet.css'

// Routes
const routes = [
  {
    path: '/',
    redirect: () => {
      const year = localStorage.getItem('selectedYear') || '2025'
      return `/${year}/map`
    }
  },
  {
    path: '/:year/map',
    name: 'map',
    component: MapView,
    props: true
  },
  {
    path: '/:year/camps',
    name: 'camps',
    component: ListView,
    props: route => ({ year: route.params.year, type: 'camp' })
  },
  {
    path: '/:year/camps/:id',
    name: 'camp-detail',
    component: DetailView,
    props: route => ({ year: route.params.year, type: 'camp', id: route.params.id })
  },
  {
    path: '/:year/art',
    name: 'art',
    component: ListView,
    props: route => ({ year: route.params.year, type: 'art' })
  },
  {
    path: '/:year/art/:id',
    name: 'art-detail',
    component: DetailView,
    props: route => ({ year: route.params.year, type: 'art', id: route.params.id })
  },
  {
    path: '/:year/events',
    name: 'events',
    component: ListView,
    props: route => ({ year: route.params.year, type: 'event' })
  },
  {
    path: '/:year/events/:id',
    name: 'event-detail',
    component: DetailView,
    props: route => ({ year: route.params.year, type: 'event', id: route.params.id })
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  },
  {
    path: '/settings/:tab',
    name: 'settings-tab',
    component: SettingsView,
    props: true
  },
  {
    path: '/settings/map',
    name: 'map-settings',
    component: MapSettingsView
  },
  {
    path: '/:year/search',
    name: 'search',
    component: SearchView,
    props: true
  },
  {
    path: '/:year/schedule',
    name: 'schedule',
    component: ScheduleView,
    props: true
  },
  {
    path: '/dust',
    name: 'dust',
    component: DustForecastView
  },
  {
    path: '/reset',
    name: 'reset',
    component: ResetView
  },
  {
    path: '/reset-now',
    name: 'reset-now',
    component: ResetView,
    props: { autoReset: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App)
  .use(router)
  .mount('#app')

// Register enhanced service worker for better onboarding experience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add cache-busting parameter to force service worker update
    navigator.serviceWorker.register('/sw-enhanced.js?v=3.1.1')
      .then(registration => {
        console.log('Enhanced ServiceWorker registration successful:', registration)
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New app version available')
                
                // Optionally notify user about update
                if (window.showToast) {
                  window.showToast('App update available - refresh to get the latest version', 'info')
                }
              }
            })
          }
        })
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', event => {
          const { type, data } = event.data
          
          if (type === 'SYNC_AVAILABLE') {
            console.log('Background sync available for:', data)
            // Could trigger UI update or data refresh
          }
        })
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err)
      })
  })
}