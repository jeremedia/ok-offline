# OK-OFFLINE Frontend Architecture

## Overview

OK-OFFLINE is an offline-first Progressive Web App built with Vue 3 and Vite. The architecture prioritizes offline functionality, performance on mobile devices, and user data privacy.

## Core Principles

1. **Offline-First**: All features must work without connectivity
2. **Mobile-First**: Optimize for phones in harsh conditions
3. **Privacy-First**: User data stays on device
4. **Performance-First**: Fast load times and smooth interactions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface (Vue 3)                 │
├─────────────────────────────────────────────────────────┤
│  Views          │  Components     │  Composables        │
│  - MapView      │  - Navigation   │  - useGeolocation   │
│  - ListView     │  - SearchBar    │  - useKeyboard      │
│  - DetailView   │  - ListControls │  - useToast         │
│  - SearchView   │  - MapControls  │  - useAutoSync      │
│  - ScheduleView │  - FavoriteBtn  │                     │
├─────────────────────────────────────────────────────────┤
│                    Services Layer                        │
│  - storage.js        - Weather & dust data              │
│  - dataSync.js       - Sync with BM API                 │
│  - favorites.js      - Manage user favorites            │
│  - schedule.js       - Personal schedule builder        │
│  - visits.js         - Track visited locations          │
│  - weatherService.js - Rails API integration            │
├─────────────────────────────────────────────────────────┤
│                    Data Layer                            │
│  IndexedDB           │  LocalStorage    │  Cache API    │
│  - Camps/Art/Events │  - Preferences   │  - Assets     │
│  - Weather Cache    │  - UI State      │  - API Data   │
│  - Vector Embeddings│  - Favorites     │               │
├─────────────────────────────────────────────────────────┤
│                 External Services                        │
│  Burning Man API  │  OK-OFFLINE API  │  OpenWeatherMap │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Views (Route Components)
Primary route components that compose the application:
- **MapView**: Interactive map with all data layers
- **ListView**: Browsable lists of camps/art/events  
- **DetailView**: Individual item details
- **SearchView**: Global search interface
- **ScheduleView**: Personal schedule management
- **SettingsView**: App configuration and data sync
- **EmergencyView**: Emergency contacts storage
- **DustForecastView**: Weather and conditions

### Shared Components
Reusable UI components:
- **Navigation**: Bottom tab navigation
- **SearchBar**: Unified search input
- **ListControls**: Sort, filter, and display options
- **MapControls**: Layer toggles and map options
- **FavoriteButton**: Star/unstar functionality

### Composables
Shared logic and state:
- **useGeolocation**: GPS and distance calculations
- **useKeyboardShortcuts**: Keyboard navigation
- **useToast**: User notifications
- **useAutoSync**: Automatic data updates

## Data Flow

### Sync Flow
```
User Action → Settings View → Data Sync Service → BM API
                                    ↓
                            IndexedDB Storage
                                    ↓
                            Component Updates
```

### Search Flow
```
Search Input → Debounce → Filter Logic → IndexedDB Query
                                              ↓
                                        Search Results
                                              ↓
                                      Vector Search API (future)
```

### Offline Strategy
1. **Initial Load**: Check IndexedDB for cached data
2. **No Data**: Redirect to Settings for initial sync
3. **Has Data**: Load from IndexedDB, work offline
4. **Online**: Optional API calls for weather/updates

## Service Worker Strategy

### Cache Strategies
- **Cache First**: App shell, CSS, JS, fonts
- **Network First**: Weather data, API responses
- **Cache Only**: User preferences, favorites

### Cache Versioning
- Manual version bump required for Safari
- Version format: `ok-offline-v{number}`
- Increment on significant changes

## State Management

### Component State
- Local state using Vue 3 Composition API
- Props/events for parent-child communication
- Provide/inject for deeply nested components

### Global State
- **Selected Year**: Stored in localStorage
- **User Preferences**: localStorage persistence
- **Cached Data**: IndexedDB with metadata

### Reactive Data
- Vue 3 reactivity for UI updates
- Computed properties for derived state
- Watchers for side effects

## Performance Optimizations

### Bundle Optimization
- Route-based code splitting
- Dynamic imports for heavy components
- Tree shaking for unused code
- Compressed assets

### Runtime Performance
- Virtual scrolling for long lists
- Debounced search input
- Lazy loading for images
- RequestAnimationFrame for animations

### Memory Management
- Component unmounting cleanup
- Event listener removal
- IndexedDB connection pooling
- Proper garbage collection

## Security Considerations

### Data Privacy
- No server-side user data storage
- Local-only emergency information
- No tracking or analytics
- API keys in environment variables

### Content Security
- Sanitized user inputs
- XSS protection
- HTTPS only in production
- Secure API communication

## Future Architecture Enhancements

### Vector Search Integration
- Service layer for vector search API
- Caching embeddings in IndexedDB
- Hybrid search result merging
- Offline vector search (WASM)

### Play Wisdom Feature
- Media capture and storage
- Offline sync queue
- Conflict resolution
- Background sync

### Performance Improvements
- Web Workers for heavy computation
- WASM for client-side ML
- Advanced caching strategies
- Progressive enhancement

---

*Architecture documentation for OK-OFFLINE frontend*