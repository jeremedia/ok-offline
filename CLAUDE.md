# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OK-OFFLINE is a Progressive Web App (PWA) built with Vue 3 and Vite that serves as an offline-first guide for Burning Man events. The app fetches data from the Burning Man Public API and caches it locally using IndexedDB, allowing participants to browse camps, art installations, and events without connectivity.

Created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK.

## Development Notes

- server is always running, no need to start it for playwright mcp testing

## Current Architecture (Vue 3 + Vite)

### Tech Stack
- **Vue 3** - Frontend framework with Composition API
- **Vue Router 4** - Client-side routing
- **Vite** - Build tool and dev server with HMR
- **Leaflet 1.9.3** - Interactive maps
- **IndexedDB** - Offline data storage
- **Service Workers** - PWA functionality
- **Berkeley Mono** - Custom monospace font

## CRITICAL: Screenshot Handling

**MANDATORY RULE FOR ALL CLAUDE CODE SESSIONS:**

When you take a screenshot using Playwright or any other tool, you MUST:
1. **ALWAYS load the screenshot immediately** using the Read tool
2. **Analyze the screenshot carefully** - look at every detail
3. **Think about what the screenshot shows** and how it relates to the task
4. **Never take screenshots without examining them** - this defeats the entire purpose

Taking screenshots without loading and analyzing them is pointless and wastes time. This is a critical requirement for all future sessions.

### Project Structure
```
ok-offline/
├── src/
│   ├── views/
│   │   ├── MapView.vue         # Interactive map with camps/art/events
│   │   ├── ListView.vue        # Sortable/filterable lists
│   │   ├── DetailView.vue      # Item details with map and events
│   │   ├── SearchView.vue      # Global search across all types
│   │   ├── ScheduleView.vue    # Personal schedule builder
│   │   ├── SettingsView.vue    # Data sync and app settings
│   │   ├── EmergencyView.vue   # Emergency contacts & medical info
│   │   ├── DustForecastView.vue # Weather and dust conditions
│   │   └── MapSettingsView.vue # GIS data and map information
│   ├── services/
│   │   ├── storage.js          # IndexedDB operations
│   │   ├── dataSync.js         # API sync with enrichment
│   │   ├── events.js           # Event-specific operations
│   │   ├── favorites.js        # Favorites management
│   │   ├── schedule.js         # Schedule management
│   │   ├── visits.js           # Visit tracking and notes
│   │   └── gisData.js          # GIS data loading and management
│   ├── composables/
│   │   ├── useGeolocation.js   # Location services
│   │   └── useKeyboardShortcuts.js # Keyboard navigation
│   ├── utils/
│   │   └── geocoding.js        # BRC address to lat/lon
│   ├── App.vue                 # Root component with navigation
│   ├── main.js                 # App entry point
│   ├── config.js               # API keys and constants
│   └── utils.js                # Shared utility functions
├── public/
│   ├── data/2025/gis/          # GIS data files (GeoJSON)
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker
├── fonts/                      # Berkeley Mono font files
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
└── index.html                  # Single page app entry
```

## Key Features Implemented

### 1. **Offline-First Architecture**
- All data synced through Settings page only (no background API calls)
- IndexedDB stores camps, art, events with enriched location data
- Service Worker caches app assets for offline use
- Works completely offline once data is synced

### 2. **Data Sync & Enrichment**
- Manual sync through Settings page
- Events enriched with camp/art location data
- Sync progress indicators
- Per-year data management
- Metadata tracking (last sync time)

### 3. **Interactive Map with GIS Data**
- Leaflet map with leaflet-rotate plugin for professional rotation
- Toggle layers for camps, art, events
- GIS data layers: streets, trash fence, city blocks, plazas, CPNs
- City alignment rotation (gate at bottom, temple at top)
- Custom markers with popups
- Favorites filter
- Click markers to view details
- BRC address geocoding (e.g., "7:30 & E")
- Interactive legend and map controls
- Base map toggle for satellite imagery

### 4. **Advanced List Views**
- Live search/filter by name
- Multiple sort options:
  - Name (alphabetical with grouping)
  - Location string
  - Sector (clock position)
  - Avenue (A-L)
  - Distance from current location
- Collapsible section headers
- Sector filters (2:00-3:00, etc.)
- Favorites toggle
- Visit tracking badges

### 5. **Personal Schedule Builder**
- Add/remove events from schedule
- Conflict detection
- Day-by-day view
- Time-sorted events
- Export functionality
- Persistent storage

### 6. **Favorites System**
- Star items in lists and details
- Filter views to show only favorites
- Synced across all views
- Persistent storage

### 7. **Visit Tracking**
- Mark camps/art as visited
- Add personal notes
- Timestamp tracking
- Visual indicators in lists

### 8. **Emergency Features**
- Store emergency contacts
- Medical information
- Allergies and medications
- Local storage only (privacy)

### 9. **Location Services**
- Get current location
- Calculate distances to camps/art
- Sort by distance
- "Enable Location" button

### 10. **Global Search**
- Search across all data types
- Filter by camps/art/events
- Paginated results
- Navigate to details

### 11. **PWA Features**
- Install as app
- Offline support
- Home screen icon
- Splash screen
- Service worker caching

### 12. **Keyboard Shortcuts**
- `1-8`: Quick navigation
- `Cmd/Ctrl + K`: Focus search
- `F`: Toggle favorites
- `L`: Toggle layers (map view)
- `/`: Quick actions

### 13. **Enhanced Weather & Dust Forecast**
- Real-time weather data from OpenWeatherMap API
- Live temperature, humidity, pressure, and wind data
- Smart dust level calculation based on weather conditions
- 5-day detailed forecast with temperature ranges
- Sunrise/sunset times and UV index
- Auto-refresh every 15 minutes with manual refresh option
- Offline caching with 10-minute cache duration
- Comprehensive error handling and loading states
- Protection recommendations based on current conditions

### 14. **Professional GIS Data Integration**
- Complete Black Rock City street network (radial and circular streets)
- Trash fence boundary defining city limits
- City blocks for accurate camp placement visualization
- Plazas and Civic Plaza Network (CPN) locations
- Professional map rotation with leaflet-rotate plugin
- Geometric analysis of BRC layout with detailed facts
- Map Settings view with comprehensive city information
- Technical details about coordinate systems and data sources
- Interactive controls for all GIS layers

## Data Flow

### 1. **API Integration**
```javascript
// Base URL: https://api.burningman.org/api/
// Endpoints: GET /{type}?year={year}
// Types: 'camp', 'art', 'event'
// Auth: X-API-Key header
// Proxied through Vite to avoid CORS
```

### 2. **Caching Strategy**
- Only load from cache in views (no API calls)
- Sync only through Settings page
- Events enriched during sync
- Each year's data stored separately
- Redirect to settings if no cached data

### 3. **Data Structures**
```javascript
// Camp
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

// Event (enriched)
{
  uid: "6Fzgz5paNv8ZbedcCQRw",
  title: "Meowiokie",
  hosted_by_camp: "a1XVI000009qe5p2AA",
  camp_name: "Camp Name",           // Enriched
  enriched_location: "7:30 & E",    // Enriched
  event_type: { label: "Music/Party", abbr: "prty" },
  occurrence_set: [{
    start_time: "2025-08-27T12:00:00-07:00",
    end_time: "2025-08-27T13:00:00-07:00"
  }]
}

// Art
{
  uid: "a1XVI000003kN6I2AU",
  name: "Temple of Gravity",
  year: 2025,
  artist: "Zachary Coffin",
  description: "...",
  location_string: "9:00 & Esplanade"
}
```

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server on port 8000
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# The dev server includes API proxy configuration
```

## Important Configuration

- **API Key**: `/src/config.js` - Update if expired
- **BRC Center**: `[40.786958, -119.202994]` (Golden Spike)
- **City Bearing**: 45° (northeast orientation)
- **Database Name**: `bm2025-db`
- **Cache Name**: `ok-offline-v1`

## Storage Architecture

### IndexedDB Structure
```javascript
Database: bm2025-db
├── art (object store)
│   ├── Key: uid
│   └── Index: year
├── camp (object store)
│   ├── Key: uid
│   └── Index: year
└── event (object store)
    ├── Key: uid
    └── Index: year
```

### LocalStorage Keys
- `selectedYear` - Current year selection
- `selectedSectors_camp` - Camp sector filters
- `selectedSectors_art` - Art sector filters
- `collapsedGroups_[type]_[sort]` - UI state
- `favorites_[type]` - Favorite items
- `schedule` - Personal schedule
- `visits_[type]` - Visit records
- `emergency_contacts` - Emergency info
- `sync_[type]_[year]` - Sync metadata

## Development Server

**IMPORTANT**: The development server is always running on port 8000.
- **URL**: http://localhost:8000
- **Status**: Always available during development
- **No need to start**: The server is persistent and ready to use
- If you need to restart: `npm run dev` (will use port 8000 or find next available)

## Common Development Tasks

### Add New View/Route
1. Create component in `/src/views/`
2. Add route in `/src/main.js`
3. Add navigation in `App.vue`
4. Update keyboard shortcuts if needed

### Add New Data Field
1. Check API response structure
2. Update display in `DetailView.vue`
3. Add to `getItemName/Location` if needed
4. Update search logic if searchable

### Modify Sync Process
1. Edit `/src/services/dataSync.js`
2. Update enrichment logic if needed
3. Test with Settings page sync
4. Verify offline functionality

### Debug Issues
1. **Cache**: DevTools > Application > IndexedDB
2. **Network**: Check for unwanted API calls
3. **Console**: Look for cache hit/miss logs
4. **Service Worker**: Check registration status

## Design Principles

1. **Offline First**: App must work without connectivity
2. **Data Sync**: Only through Settings page (explicit user action)
3. **Performance**: Minimize bundle size, lazy load when possible
4. **Accessibility**: Semantic HTML, keyboard navigation
5. **Mobile First**: Touch-friendly, responsive design
6. **Privacy**: Emergency/medical data stays local only

## Testing Checklist

- [ ] Sync data for all years
- [ ] Test offline mode (airplane mode)
- [ ] Verify event locations show correctly
- [ ] Test favorites across views
- [ ] Check schedule conflict detection
- [ ] Verify map markers and popups
- [ ] Test search functionality
- [ ] Check responsive design
- [ ] Test PWA installation
- [ ] Verify keyboard shortcuts
- [ ] Test weather API integration and caching
- [ ] Verify weather data displays correctly offline
- [ ] Test weather auto-refresh functionality

## Known Issues & Limitations

1. **2025 Data**: Camp locations not yet assigned (normal pre-event)
2. **Geolocation**: Requires HTTPS in production
3. **Large datasets**: Consider pagination for better performance
4. **Service Worker**: Must be served over HTTPS for PWA features

## Future Enhancements (from todo list)

- Event reminders/notifications
- Calendar view for events  
- Photo upload capability
- Data export/import
- Social sharing features
- Bike route planning
- QR code scanner
- Gift/offering tracker
- Playa time converter
- Voice search
- Onboarding tour

## API Notes

The Burning Man API returns different data based on the year and proximity to the event. Camp placement data (location assignments) is typically not available until closer to the event date.

## Data Management

### Pre-Enriched Static Data
The app uses pre-enriched static JSON files to improve performance:
- Events are enriched with camp/art location data at build time
- This saves processing time on mobile devices  
- Run `node scripts/enrich-static-data.js` to update enrichment
- Static data files are stored in `/public/data/[year]/`

### API Key Security
- API keys are stored in environment variables
- Create a `.env` file based on `.env.example`
- Never commit API keys to the repository
- The app uses `import.meta.env.VITE_BM_API_KEY` to access the key

## Deployment & Version Management

### Automatic Deployment
The app automatically deploys to production at https://offline.oknotok.com on every push to the main branch:

1. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - Triggers on push to main
   - Builds the Vue app
   - Deploys via SSH to Caddy server
   - Zero-downtime deployment

2. **Production URL**: https://offline.oknotok.com
   - Hosted on Caddy server
   - SSL automatically provisioned
   - PWA headers configured

### Semantic Versioning
The app uses automatic semantic versioning based on commit messages:

1. **Version Bumping** (`.github/workflows/version-bump.yml`)
   - Runs on every push to main
   - Reads commit messages to determine version bump
   - Updates package.json version
   - Creates git tag

2. **Commit Message Conventions**:
   ```bash
   # Patch bump (1.0.0 → 1.0.1)
   fix: Correct event location display
   
   # Minor bump (1.0.1 → 1.1.0)
   feat: Add voice search functionality
   
   # Major bump (1.1.0 → 2.0.0)
   feat: [major] Complete redesign of UI
   ```

3. **Version Display**:
   - Current version shown in Settings > About tab
   - Build timestamp included
   - Version injected at build time via Vite

### Release Notes
Maintain release history in `CHANGELOG.md`:

1. **Changelog Format**: Follow [Keep a Changelog](https://keepachangelog.com/) format
2. **View in App**: Settings > About > "View Release Notes" button
3. **Update Process**: 
   - Add changes to CHANGELOG.md
   - Update release notes in SettingsView.vue
   - Consider using `scripts/parse-changelog.js` for automation

### Deployment Checklist
Before pushing to main:
- [ ] Test locally with `npm run build && npm run preview`
- [ ] Update CHANGELOG.md if adding features
- [ ] **Increment service worker cache version** in `public/sw.js` (e.g., `ok-offline-v4` → `ok-offline-v5`)
- [ ] Use conventional commit messages for proper versioning
- [ ] Check GitHub Actions after push for deployment status

**Important**: Always bump the service worker cache version for each release. Safari and other browsers aggressively cache service workers, and without a version bump, users may not receive the latest updates.

## Contributing

When making changes:
1. Follow existing code patterns
2. Maintain offline-first principle
3. Test with/without connectivity
4. Update this documentation
5. Add comments for complex logic
6. Use conventional commits for automatic versioning

Remember: This app is designed to work in the harsh conditions of Black Rock City where connectivity is limited or non-existent. Every feature should work offline once data is synced.

## Weather API Configuration

The enhanced weather/dust forecast feature requires an OpenWeatherMap API key:

1. **Get API Key**: Sign up at https://openweathermap.org/api for a free account
2. **Environment Setup**: Copy `.env.example` to `.env` and add your key:
   ```
   VITE_WEATHER_API_KEY=your_weather_api_key_here
   ```
3. **Features**: 
   - 1 million free API calls per month
   - Real-time weather for Black Rock City coordinates
   - Smart caching for offline use
   - Auto-refresh every 15 minutes
   - Graceful fallback when offline

Without an API key, the app will show a configuration error but all other features remain functional.

## Visual Testing Protocol

When testing UI changes, especially for mobile optimization:

### 1. Screenshot Workflow
**ALWAYS follow this two-step process:**
```javascript
// Step 1: Take screenshot
playwright_screenshot(name: "descriptive-name")
// Step 2: IMMEDIATELY read the file
Read(file_path: "../../Downloads/[screenshot-filename].png")
```

### 2. Screenshot Analysis Template
When viewing a screenshot, analyze using this structure:
```
SCREENSHOT ANALYSIS:
1. **Overall Layout**: What is the general structure?
2. **Header/Navigation**: What's at the top?
3. **Main Content**: What's in the center/body?
4. **Interactive Elements**: Buttons, forms, controls visible?
5. **Visual Issues**: Anything broken, overlapping, cut off?
6. **Mobile-Specific**: Touch targets, spacing, readability?
```

### 3. Testing Multiple Viewports
Always test at these viewport sizes:
- **Mobile**: 390x844 (iPhone 14)
- **Tablet**: 768x1024 (iPad Mini)  
- **Desktop**: 1920x1080

### 4. Mobile Testing Checklist
- [ ] Touch targets minimum 44x44px
- [ ] No horizontal scrolling
- [ ] Bottom navigation accessible
- [ ] Modals/overlays properly positioned
- [ ] Text readable (min 16px)
- [ ] Proper spacing between elements
- [ ] Landscape orientation works

### 5. Development Testing Notes
- **Service Worker**: May cache old code - disable for testing
- **Mobile Detection**: Uses width < 600px for development
- **Real Devices**: Production uses touch + user agent detection

### 6. Helper Functions
Use the screenshot helper for consistent analysis:
```javascript
import { logScreenshotReminder, documentVisualTest } from './utils/screenshotHelper'
```

**IMPORTANT**: Never claim to "see" a screenshot without reading the file first. Be explicit when visual verification is needed.
