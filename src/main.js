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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App)
  .use(router)
  .mount('#app')

// Service worker disabled for development
// TODO: Re-enable for production
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration)
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err)
      })
  })
}
*/
