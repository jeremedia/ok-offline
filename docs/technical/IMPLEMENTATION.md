# OK-OFFLINE Implementation Guide

Technical implementation details for developers working on OK-OFFLINE.

## Architecture Overview

OK-OFFLINE follows a strict offline-first architecture where:
1. Data is only fetched via explicit user action (Settings page sync)
2. All views load exclusively from cache
3. No background API calls are made
4. If no cached data exists, user is redirected to Settings

## Component Architecture

### View Components

#### MapView.vue
```javascript
// Key responsibilities:
- Initialize Leaflet map centered on BRC
- Create layer groups for camps, art, events
- Handle marker clicks and popups
- Toggle layers based on user selection
- Filter by favorites when enabled

// Key methods:
initMap() - Set up Leaflet instance
loadMarkers() - Fetch data from cache and create markers
createMarker() - Generate appropriate marker for item type
toggleLayer() - Show/hide layer groups
```

#### ListView.vue
```javascript
// Key features:
- Sort by: name, location, sector, avenue, distance
- Filter by: search query, sectors, favorites
- Group by first letter/sector/avenue
- Collapsible sections with persistence
- No API calls - cache only

// Key computed properties:
sortedItems - Apply sort logic
groupedItems - Group items by header
filteredItems - Apply all filters
```

#### DetailView.vue
```javascript
// Displays comprehensive item information:
- All fields from API
- Mini-map with location
- Camp events (for camps)
- Favorite/visit actions
- Personal notes

// No API refresh - cache only
```

#### SearchView.vue
```javascript
// Global search implementation:
- Search across all types simultaneously
- Type filters (camps/art/events)
- Paginated results
- Load more functionality
- Direct navigation to details
```

#### ScheduleView.vue
```javascript
// Personal schedule management:
- Add/remove events
- Conflict detection algorithm
- Day tabs (Monday-Sunday)
- Time-based sorting
- LocalStorage persistence
```

#### SettingsView.vue
```javascript
// Data sync control center:
- Manual sync triggers
- Progress indicators
- Sync status per year/type
- Error handling
- Clear data options

// This is the ONLY place API calls happen
```

### Service Layer

#### storage.js - IndexedDB Operations
```javascript
// Database configuration
const DB_NAME = 'bm2025-db'
const DB_VERSION = 2  // Increased to add year index to all stores

// Core methods:
async function initDB() {
  // Create object stores: art, camp, event
  // Create indexes by year
}

async function saveToCache(type, year, items) {
  // Bulk save with year assignment
  // Transaction handling
}

async function getFromCache(type, year) {
  // Query by type and year
  // Return empty array if none
}
```

**Database Version History:**
- **Version 1**: Initial schema with basic object stores (art, camp, event)
- **Version 2**: Added 'year' index to all stores for efficient multi-year queries

The `onupgradeneeded` handler manages schema migrations automatically, preserving existing data while adding new indexes or stores as needed.

#### dataSync.js - API Sync & Enrichment
```javascript
// Sync pipeline:
1. syncYear(year) - Orchestrates full sync
2. syncType(type, year) - Fetch from API
3. enrichAndSaveEvents(year) - Add location data

// Event enrichment:
- Match events to camps via hosted_by_camp
- Add camp_name and enriched_location
- Preserve enrichment in cache
```

#### favorites.js - Favorites Management
```javascript
// LocalStorage-based persistence
// Key format: favorites_[type]

export function toggleFavorite(type, uid) {
  const favorites = getFavorites(type)
  const index = favorites.indexOf(uid)
  
  if (index > -1) {
    favorites.splice(index, 1)
  } else {
    favorites.push(uid)
  }
  
  localStorage.setItem(`favorites_${type}`, JSON.stringify(favorites))
  return index === -1 // true if added
}
```

#### schedule.js - Schedule Management
```javascript
// Conflict detection algorithm:
function hasConflict(event1, event2) {
  const start1 = new Date(event1.startTime)
  const end1 = new Date(event1.endTime)
  const start2 = new Date(event2.startTime)
  const end2 = new Date(event2.endTime)
  
  return start1 < end2 && start2 < end1
}

// Storage in LocalStorage as JSON
```

#### visits.js - Visit Tracking
```javascript
// Track visits with timestamps and notes
// Key format: visits_[type]

// Structure:
{
  [uid]: {
    visitedAt: timestamp,
    notes: "User's personal notes"
  }
}
```

### Utility Modules

#### geocoding.js - BRC Address Conversion
```javascript
// Convert "7:30 & E" to [lat, lon]

// Algorithm:
1. Parse clock position and avenue
2. Convert clock to angle (accounting for 45° rotation)
3. Calculate distance from center
4. Apply trigonometry for coordinates

// Special cases:
- Center Camp
- The Man (Golden Spike)
- Temple
- Airport
```

#### utils.js - Shared Utilities
```javascript
// Common functions:
getItemName(item) - Extract display name
getItemLocation(item) - Extract location string
formatDate(date) - Day of week formatting
formatTime(date) - 12-hour time format
clockPositionToNumber() - Convert "7:30" to 7.5
```

### Composables

#### useGeolocation.js
```javascript
// Geolocation wrapper with:
- Permission handling
- Distance calculations
- Error management
- Reactive state

// Usage:
const { userLocation, getCurrentLocation, getDistanceTo } = useGeolocation()
```

#### useKeyboardShortcuts.js
```javascript
// Global keyboard navigation:
- Number keys 1-8 for sections
- Cmd/Ctrl+K for search focus
- F for favorites toggle
- L for layer toggle (map only)
```

## Data Flow Patterns

### Initial Load Pattern
```
User visits /2025/camps
  ↓
ListView mounted
  ↓
loadData() called
  ↓
getFromCache('camp', '2025')
  ↓
If data exists: Display
If no data: Redirect to /settings
```

### Sync Pattern
```
User clicks "Sync Now"
  ↓
syncYear(year) called
  ↓
For each type (camp, art, event):
  - Fetch from API
  - Save to IndexedDB
  ↓
enrichAndSaveEvents()
  - Load camps/art from cache
  - Match events to locations
  - Update events in cache
```

### No Background Refresh
Previously, views would refresh data in background. This has been removed to ensure:
- Event locations aren't overwritten
- Predictable offline behavior
- Explicit user control

## State Management

### Global State Store (globalState.js)
The application uses a centralized store for location data visibility:

```javascript
import { shouldShowLocation, canShowLocations } from '@/stores/globalState'

// Component implementation
const showLocation = computed(() => shouldShowLocation(item.value))

// Template usage
<div v-if="showLocation">{{ item.location_string }}</div>
<div v-else>Location will be revealed closer to the event</div>
```

#### Implementation Guidelines
1. **Never check location_string directly** - Always use `shouldShowLocation()`
2. **Provide feedback** - Show clear messages when locations are hidden
3. **Filter properly** - Remove items without viewable locations from maps
4. **Test both states** - Verify UI works with locations shown and hidden

### Application State (App.vue)
- Selected year
- Online/offline status
- Last sync time
- Navigation state

### Local State (Components)
- Sort/filter preferences
- UI state (collapsed sections)
- Form inputs
- Loading states

### Persistent State
- LocalStorage: Preferences, favorites, schedule, visits, location visibility
- IndexedDB: All API data
- URL: Current route and year

## API Integration

### Proxy Configuration (vite.config.js)
```javascript
proxy: {
  '/api': {
    target: 'https://api.burningman.org/api',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
    headers: {
      'X-API-Key': API_KEY
    }
  }
}
```

### API Response Handling
```javascript
// Expected structures handled:
- Array of items
- Object with data array
- Object with type-specific array

// Normalization:
items = Array.isArray(data) ? data : 
        data.data ? data.data :
        data[type] ? data[type] : []
```

## Performance Optimizations

### Code Splitting
- Vue Router handles view-level splitting
- Dynamic imports for heavy services
- Lazy loading of map library

### Caching Strategy
- Service Worker caches all assets
- IndexedDB for data persistence
- LocalStorage for small preferences
- Memory caching in components

### Rendering Optimizations
- Virtual scrolling considered for large lists
- Debounced search input
- Reactive computed properties
- Minimal re-renders

## Error Handling

### Network Errors
- Caught in sync process
- User-friendly messages
- Retry capabilities
- Fallback to cached data

### Storage Errors
- IndexedDB quota handling
- LocalStorage fallbacks
- Clear data options

### Navigation Errors
- Redirect to settings if no data
- 404 handling for invalid IDs
- Graceful degradation

## Location Visibility Implementation

### Common Patterns

#### List View Implementation
```javascript
// Import global state helpers
import { shouldShowLocation } from '@/stores/globalState'
import { getItemLocation } from '@/utils'

// In setup()
const getDisplayLocation = (item) => {
  if (!shouldShowLocation(item)) {
    return 'Location TBD'
  }
  return getItemLocation(item) || 'Location TBD'
}

// In template
<span class="location">{{ getDisplayLocation(item) }}</span>
```

#### Map View Implementation
```javascript
// Filter markers before display
const visibleMarkers = computed(() => {
  return items.value.filter(item => {
    // Only show items with viewable locations
    return shouldShowLocation(item) && item.location_string
  })
})

// Create markers only for visible items
visibleMarkers.value.forEach(item => {
  const coords = geocodeLocation(item.location_string)
  if (coords) {
    L.marker(coords).addTo(map)
  }
})
```

#### Detail View Implementation
```vue
<template>
  <div class="location-section">
    <h3>Location</h3>
    <template v-if="shouldShowLocation(item)">
      <p>{{ item.location_string }}</p>
      <button @click="showOnMap">View on Map</button>
    </template>
    <template v-else>
      <p class="location-notice">
        <Icon name="clock" />
        Location information will be available starting 
        {{ item.year === 2025 ? 'August 17, 2025' : 'closer to the event' }}
      </p>
    </template>
  </div>
</template>
```

#### Search Results Implementation
```javascript
// Modify search results to respect visibility
const processSearchResults = (results) => {
  return results.map(result => ({
    ...result,
    displayLocation: shouldShowLocation(result.item) 
      ? result.item.location_string 
      : 'Location TBD',
    canShowOnMap: shouldShowLocation(result.item) && !!result.item.location_string
  }))
}
```

## Testing Strategies

### Manual Testing Checklist
```
□ Sync data for each year
□ Turn on airplane mode
□ Verify all features work offline
□ Test event location display
□ Check favorites persistence
□ Verify schedule conflicts
□ Test map markers
□ Test location visibility (before/after Aug 17, 2025)
□ Check responsive layouts
□ Install as PWA
```

### Key Test Scenarios
1. **First-time user**: Should see settings
2. **Offline user**: Should see cached data
3. **Sync failure**: Should show errors
4. **Large dataset**: Should perform well
5. **Mobile device**: Should be responsive

## Security Considerations

### API Key Management
- Stored in config.js
- Proxied through Vite in dev
- Consider environment variables for production

### Data Privacy
- No personal data sent to servers
- Emergency info stays local
- No analytics or tracking
- HTTPS required for PWA

### Input Validation
- Sanitize user notes
- Validate data structures
- Handle malformed API responses

## Deployment

### Build Process
```bash
npm run build
# Outputs to dist/ directory
# Ready for static hosting
```

### Hosting Requirements
- HTTPS for PWA features
- Static file serving
- No server-side logic needed
- CDN-friendly

### Environment Setup
- Update API key if needed
- Configure base URL
- Set up SSL certificates
- Enable service worker

## Future Considerations

### Scalability
- Pagination for huge datasets
- Incremental sync updates
- Differential data updates
- WebWorker for heavy operations

### Features
- Real-time updates (WebSocket)
- Collaborative features
- Cloud backup option
- Native app wrapper

### Maintenance
- API version monitoring
- Data structure migrations
- Performance monitoring
- Error reporting

## Development Workflow

### Adding a Feature
1. Update route if needed (main.js)
2. Create/modify view component
3. Add service layer if needed
4. Update navigation (App.vue)
5. Add to keyboard shortcuts
6. Update documentation

### Debugging Tools
- Vue DevTools for state inspection
- Chrome DevTools Application tab
- Network tab (should be quiet!)
- Console for cache logs

### Code Style
- Vue 3 Composition API
- Async/await over promises
- Descriptive variable names
- Comments for complex logic
- No unused imports

## Conclusion

OK-OFFLINE prioritizes reliability and offline functionality over real-time updates. Every architectural decision supports the goal of working perfectly in the internet-free environment of Black Rock City.

When in doubt:
- Cache everything
- Work offline
- Give users control
- Fail gracefully
- Document thoroughly