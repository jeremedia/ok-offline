# Technical Documentation

Technical architecture and implementation details for OK-OFFLINE.

## 📚 Available Documentation

- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Detailed implementation notes
- **[BURNING_MAN_API.md](BURNING_MAN_API.md)** - External API documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and decisions (coming soon)

## 🏗️ Architecture Overview

### Frontend Stack
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite for fast development
- **Routing**: Vue Router 4
- **State**: Component-based with composables
- **Styling**: Custom CSS with mobile-first approach

### Data Layer
- **Storage**: IndexedDB for offline data
- **Caching**: Service Worker with cache strategies
- **Sync**: Manual sync through settings
- **Format**: JSON data from Burning Man API

### Map Technology
- **Library**: Leaflet 1.9.x
- **Plugins**: leaflet-rotate for rotation
- **Data**: GeoJSON for GIS layers
- **Coordinates**: BRC street grid system

### API Integration
- **Weather**: Rails API proxy to OpenWeatherMap/Apple
- **BM Data**: Direct from api.burningman.org
- **Vector Search**: Rails API with pgvector (backend ready)

## 🔧 Key Technical Decisions

### Offline-First Architecture
- All critical data stored locally
- Network requests are optional enhancements
- Graceful degradation when offline
- Manual sync for user control

### Performance Optimizations
- Route-based code splitting
- Lazy loading for maps and heavy components
- Efficient IndexedDB queries
- Optimized bundle sizes

### Mobile Optimization
- Touch-first interactions
- Responsive layouts
- Performance on low-end devices
- Battery-efficient operations

## 📊 Data Structures

### IndexedDB Schema
```javascript
Database: bm{year}-db
├── camps (uid, name, location, ...)
├── art (uid, name, artist, location, ...)
└── events (uid, title, camp_id, times, ...)
```

### LocalStorage Keys
- User preferences
- Selected year
- Favorites and schedule
- UI state

## 🚀 Future Technical Enhancements

- WebAssembly for client-side search
- Progressive image loading
- Advanced caching strategies
- Real-time sync capabilities

---

*Technical documentation for OK-OFFLINE developers*