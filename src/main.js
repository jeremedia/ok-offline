import { createApp, nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Initialize theme system
import { initializeTheme } from './services/themeService'

// Import views
import MapView from './views/MapView.vue'
import ListView from './views/ListView.vue'
import DetailView from './views/DetailView.vue'
import SettingsView from './views/SettingsView.vue'
import MapSettingsView from './views/MapSettingsView.vue'
import SearchView from './views/SearchView.vue'
import ScheduleView from './views/ScheduleView.vue'
// import DustForecastView from './views/DustForecastView.vue'
import DustForecastView from './views/DustForecastViewClean.vue'
import ResetView from './views/ResetView.vue'
import NotFound from './views/NotFound.vue'
import PromptsView from './views/PromptsView.vue'
import InfrastructureView from './views/InfrastructureView.vue'
import InfrastructureDetailView from './views/InfrastructureDetailView.vue'
import IconViewer from './views/IconViewer.vue'
import ComponentsView from './views/ComponentsView.vue'
import KnowledgeGraphView from './views/KnowledgeGraphView.vue'
import CampDashboardView from './views/CampDashboardView.vue'
import CampTimelineView from './views/CampTimelineView.vue'
import CampEditorView from './views/CampEditorView.vue'

// Import CSS
import './styles/fonts.css'
import './styles/global.css'
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
    path: '/:year/infrastructure',
    name: 'infrastructure',
    component: InfrastructureView,
    props: true
  },
  {
    path: '/:year/infrastructure/:id',
    name: 'infrastructure-detail',
    component: InfrastructureDetailView,
    props: true
  },
  {
    path: '/:year/camp/:slug',
    name: 'camp-dashboard',
    component: CampDashboardView,
    props: true
  },
  {
    path: '/:year/camp/:slug/timeline',
    name: 'camp-timeline',
    component: CampTimelineView,
    props: true
  },
  {
    path: '/:year/camp/:slug/edit',
    name: 'camp-editor',
    component: CampEditorView,
    props: true
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
    path: '/settings/about/release-notes',
    name: 'release-notes',
    component: SettingsView,
    props: { tab: 'about', showReleaseNotes: true }
  },
  {
    path: '/release-notes',
    redirect: '/settings/about/release-notes'
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
  },
  {
    path: '/prompts',
    name: 'prompts',
    component: PromptsView
  },
  {
    path: '/icon_viewer',
    name: 'icon-viewer',
    component: IconViewer
  },
  {
    path: '/components',
    name: 'components',
    component: ComponentsView
  },
  {
    path: '/knowledge',
    name: 'knowledge-graph',
    component: KnowledgeGraphView
  },
  {
    path: '/graph-test',
    name: 'graph-test',
    component: () => import('./components/graph/GraphRendererTest.vue')
  },
  {
    path: '/reload',
    beforeEnter: () => {
      // Force a full page reload
      window.location.reload()
      // Return false to prevent navigation
      return false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create app first but don't mount yet
const app = createApp(App)
app.use(router)

// Initialize theme asynchronously before mounting
initializeTheme().then(() => {
  app.mount('#app')
}).catch(error => {
  console.error('Failed to initialize theme:', error)
  // Mount anyway with fallback
  app.mount('#app')
})

// Hide the initial loader once Vue app is mounted
// But delay slightly more to ensure smooth transition
nextTick(() => {
  window.updateLoadingStatus('App ready!', 100)
  // Check if we need to show onboarding
  const onboardingCompleted = localStorage.getItem('onboarding_completed')
  const message = onboardingCompleted ? 'Loading app...' : 'Preparing first-time setup...'
  window.updateLoadingStatus(message, 100)
  
  setTimeout(() => {
    window.hideInitialLoader()
  }, 1000) // Increased delay for smoother transition
})

// Register enhanced service worker for better onboarding experience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Add cache-busting parameter to force service worker update
    navigator.serviceWorker.register('/sw.js?v=3.9.0')
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
