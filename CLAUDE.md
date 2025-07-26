# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) built with Vue 3 and Vite that serves as an offline-first guide for Burning Man events. The app fetches data from the Burning Man Public API and caches it locally using IndexedDB, allowing participants to browse camps, art installations, and events without connectivity.

## Current Architecture (Vue 3 + Vite)

### Tech Stack
- **Vue 3** - Frontend framework with Composition API
- **Vue Router 4** - Client-side routing
- **Vite** - Build tool and dev server with HMR
- **Leaflet 1.9.3** - Interactive maps
- **IndexedDB** - Offline data storage
- **Berkeley Mono** - Custom monospace font

### Project Structure
```
okoffline-2025/
├── src/
│   ├── views/
│   │   ├── MapView.vue      # Main map display
│   │   ├── ListView.vue     # List of camps/art/events with sorting
│   │   └── DetailView.vue   # Detail view with mini-map and events
│   ├── services/
│   │   ├── storage.js       # IndexedDB operations for offline caching
│   │   └── events.js        # Event filtering and camp event fetching
│   ├── App.vue              # Root component with navigation
│   ├── main.js              # App entry point and router setup
│   ├── config.js            # API keys and constants
│   └── utils.js             # Shared utility functions
├── fonts/                   # Berkeley Mono font files (.woff/.woff2)
├── API_DOC.md              # Burning Man API documentation
├── to_do_features.md       # Feature checklist
├── vite.config.js          # Vite configuration with API proxy
├── package.json            # Dependencies and scripts
└── index.html              # Single page app entry
```

### Key Features Implemented
1. **Offline Storage**: Full IndexedDB integration with cache-first loading strategy
2. **URL Routing**: Clean URLs like `/2024/camps`, `/2025/camps/uid`
3. **Year Selection**: Persistent year selection stored in localStorage
4. **Sorting**: List items can be sorted by name or location
5. **Camp Events**: Events are fetched and displayed on camp detail pages
6. **Responsive Design**: Mobile-friendly with Berkeley Mono font
7. **Background Updates**: Cached data is refreshed in background when online

### Data Flow
1. **API Endpoints**: 
   - Base URL: `https://api.burningman.org/api/`
   - Endpoints: `GET /{type}?year={year}` where type is 'camp', 'art', or 'event'
   - Authentication: `X-API-Key` header
   - Proxied through Vite dev server to `/api/` to avoid CORS

2. **Caching Strategy**:
   - Check IndexedDB first for cached data
   - Display cached data immediately if available
   - Fetch fresh data in background and update cache
   - Show cached data even when offline (no error if can't refresh)
   - Each year's data is indexed separately

3. **Data Structures**:
   ```javascript
   // Camp structure
   {
     uid: "a1XVI000009sXeX2AU",
     name: "42 Ramen",
     year: 2025,
     hometown: "Salt Lake City",
     description: "...",
     location: {
       frontage: "6:30",
       intersection: "A",
       intersection_type: "&",
       dimensions: "150 x 200"
     },
     location_string: "6:30 & A"
   }
   
   // Event structure
   {
     uid: "6Fzgz5paNv8ZbedcCQRw",
     title: "Meowiokie",
     hosted_by_camp: "a1XVI000009qe5p2AA",  // Links to camp.uid
     event_type: { label: "Music/Party", abbr: "prty" },
     occurrence_set: [{
       start_time: "2025-08-27T12:00:00-07:00",
       end_time: "2025-08-27T13:00:00-07:00"
     }]
   }
   ```

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server on port 8000 (includes API proxy)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Important Configuration

- **API Key**: Set in `/src/config.js` (current: `19b5320c7af94665aa17fa0e6daaf10b`)
- **API Proxy**: Configured in `vite.config.js` to proxy `/api` to Burning Man API
- **Font Files**: Berkeley Mono fonts in `/fonts/` directory
- **BRC Center**: Golden Spike coordinates: `[40.786958, -119.202994]`

## Current To-Do Status (from to_do_features.md)

### ✅ Completed:
- Camp events listed on camp detail pages (filtered by `hosted_by_camp`)
- Item headers are bold in detail view

### 🔲 Pending:
- Group list by first letter when sorted by name
- Sort by sector (clock positions 2:00 to 10:00)
- Sort by avenue (letters A-L from inner to outer)

## Key Implementation Details

### ListView.vue
- Implements cache-first loading with background refresh
- Sorts by name (alphabetical) or location (string comparison)
- Highlights selected item when navigating from detail view
- TODO: Add section headers for grouping

### DetailView.vue
- Shows all camp fields (description, hometown, location, etc.)
- Fetches and displays events hosted by the camp
- Formats event times as "Day HH:MM AM/PM - HH:MM AM/PM"
- Mini-map currently shows BRC center (TODO: geocode addresses)

### Storage Service (storage.js)
- Database: `bm2025-db`, version 1
- Object stores: `art`, `camp`, `event` with `uid` as key
- Indexes by `year` for efficient filtering
- Methods:
  - `saveToCache(type, year, items)`
  - `getFromCache(type, year)`
  - `clearCache()`
  - `getCacheStats()`

### Events Service (events.js)
- `getCampEvents(campId, year)` - Filters events by `hosted_by_camp`
- Uses same cache-first strategy as lists

## Notes for Next Session

1. **Vanilla JS Version**: The old vanilla JS version is saved as `index-vanilla.html` and `app.js`
2. **Service Worker**: Currently commented out in index.html, can re-enable for full PWA
3. **Python Server**: `server.py` exists for SPA routing but Vite handles this now
4. **Map Geocoding**: Need algorithm to convert BRC addresses (e.g., "7:30 & E") to lat/lon coordinates
5. **Virtual Scrolling**: Consider for performance with large lists
6. **Search**: Could add full-text search across all data types

## Common Tasks

### Add a new data field to detail view:
1. Add to DetailView.vue template with v-if check
2. Follow pattern: `<div class="detail-field" v-if="item.fieldname">`

### Add new sort option:
1. Add option to ListView.vue select element
2. Add case to sortedItems computed property
3. Create getter function in utils.js if needed

### Debug caching:
1. Open DevTools > Application > IndexedDB > bm2025-db
2. Check Console for cache hit/miss messages
3. Network tab shows API calls (should see fewer when cached)