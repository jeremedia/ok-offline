# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OK-OFFLINE is a Progressive Web App (PWA) built with Vue 3 and Vite that serves as an offline-first guide for Burning Man events. The app fetches data from the Burning Man Public API and caches it locally using IndexedDB, allowing participants to browse camps, art installations, and events without connectivity.

Created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK.

## Development Notes

- **Dev server is ALWAYS running** - The Vite development server is persistent and automatically hot-reloads all code changes
- **Never attempt to start the dev server** - It's already running and trying to start it wastes time
- **Code updates are instant** - Vite ensures browser code is updated immediately with every file save
- **Access the app at**: http://100.104.170.10:8005
- No need to restart server for testing or development

## Current Architecture (Vue 3 + Vite)

### Tech Stack
- **Vue 3** - Frontend framework with Composition API
- **Vue Router 4** - Client-side routing
- **Vite** - Build tool and dev server with HMR
- **Leaflet 1.9.3** - Interactive maps
- **IndexedDB** - Offline data storage
- **Service Workers** - PWA functionality
- **Berkeley Mono** - Custom monospace font

### Body-Level Mobile Class System

The app uses a sophisticated body-level class system for mobile/desktop targeting that provides precise CSS control without media queries.

#### Implementation (`src/App.vue`)
- **Enhanced Mobile Detection**: Multi-factor detection using screen width, touch capability, and user agent
- **Development Mode**: Uses width-only detection (`< 600px`) for easier testing
- **Production Mode**: Combines screen size + touch/UA for accurate mobile detection
- **Reactive Classes**: `watchEffect` automatically applies `mobile-device` or `desktop-device` classes to body element

#### Global CSS Integration (`src/styles/global.css`)
```css
/* Target mobile devices */
body.mobile-device h1 { font-weight: bold; }
body.mobile-device button { min-height: 44px; }

/* Target desktop devices */
body.desktop-device .card:hover { transform: translateY(-2px); }
```

#### Key Features
- **Automatic Updates**: Classes change reactively when viewport resizes
- **iOS Optimizations**: 16px font size prevents zoom, tap highlight disabled
- **Touch Targets**: 44px minimum button sizes on mobile
- **Debug Logging**: Console logs device mode changes during development

#### Usage Patterns
- **Mobile-Specific Styles**: `body.mobile-device .component { ... }`
- **Desktop-Only Effects**: `body.desktop-device .hover-effect:hover { ... }`
- **Responsive Spacing**: Target different devices without media queries
- **Touch Optimization**: Mobile-specific touch targets and interactions

#### Testing Verified
| Viewport | Class Applied | Status |
|----------|---------------|--------|
| 390px | `mobile-device` | ✅ |
| 599px | `mobile-device` | ✅ |
| 600px | `desktop-device` | ✅ |
| 1920px | `desktop-device` | ✅ |

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
│   │   ├── SearchView.vue      # AI-powered search with 3 modes
│   │   ├── ScheduleView.vue    # Personal schedule builder
│   │   ├── SettingsView.vue    # Data sync and app settings
│   │   ├── EmergencyView.vue   # Emergency contacts & medical info
│   │   ├── DustForecastView.vue # Weather and dust conditions
│   │   └── MapSettingsView.vue # GIS data and map information
│   ├── components/search/      # Search UI components
│   │   ├── SearchModeSelector.vue  # Keyword/Semantic/Smart modes
│   │   ├── SearchResultItem.vue    # Result display with scores
│   │   └── SearchSuggestions.vue   # Autocomplete suggestions
│   ├── services/
│   │   ├── storage.js          # IndexedDB operations
│   │   ├── dataSync.js         # API sync with enrichment
│   │   ├── events.js           # Event-specific operations
│   │   ├── favorites.js        # Favorites management
│   │   ├── schedule.js         # Schedule management
│   │   ├── visits.js           # Visit tracking and notes
│   │   ├── gisData.js          # GIS data loading and management
│   │   ├── vectorSearchService.js  # AI search API integration
│   │   └── weatherServiceCombined.js # Weather API integration
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

### 15. **AI-Powered Vector Search (Live in Production ✅)**
- Three search modes available at https://offline.oknotok.com:
  - **Keyword Mode**: Traditional text search (works offline)
  - **Semantic Mode**: AI understands meaning and context
  - **Smart Mode**: Hybrid approach combining both
- OpenAI embeddings with 750+ indexed items
- Similarity scores show match quality
- 24-hour result caching for performance
- URL parameters for shareable searches (?q=query&mode=semantic)
- Autocomplete suggestions while typing
- Graceful offline fallback to keyword search
- Production response time: 200-400ms

### 16. **Global Location State System**
- Centralized management of location data visibility across the entire app
- Smart policy enforcement for 2025 Burning Man API data:
  - Historical years (2023-2024): Always show location data
  - Current year (2025): Apply official API visibility policy
  - Development mode: Always show locations if available (for testing)
- Automatic detection of location data availability during sync
- Persistent state in localStorage for consistency across sessions
- Policy timing for 2025:
  - API data available 3 weeks before event (developers only)
  - Camp locations visible first Sunday of build week (12:01am)
  - Art locations visible when gates open
- Components automatically respect visibility rules
- Graceful degradation when locations are hidden

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

# Start dev server on port 8005 with Tailscale IP
npm run dev -- --host 0.0.0.0 --port 8005

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
Database: bm2025-db (version: 2)
├── art (object store)
│   ├── Key: uid
│   └── Index: year (added in v2)
├── camp (object store)
│   ├── Key: uid
│   └── Index: year (added in v2)
└── event (object store)
    ├── Key: uid
    └── Index: year (added in v2)
```

**Note**: DB_VERSION is currently 2. The upgrade handler automatically adds the 'year' index to existing stores during migration.

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
- `location_data_state` - Global location visibility state

## Development Server

**IMPORTANT**: The development server runs on port 8005 with Tailscale IP.
- **URL**: http://100.104.170.10:8005
- **Status**: Always available during development
- **No need to start**: The server is persistent and ready to use
- If you need to restart: `npm run dev -- --host 0.0.0.0 --port 8005`

## Global Location State System

### Overview
The global location state system (`/src/stores/globalState.js`) provides centralized management of location data visibility across the entire application. This system ensures compliance with Burning Man API policies while providing a seamless user experience.

### Core Components

#### 1. Global State Store
```javascript
import { globalState, canShowLocations, shouldShowLocation } from '@/stores/globalState'

// State structure
globalState = {
  location_data_available: {
    '2023': true,   // Historical data
    '2024': true,   // Historical data
    '2025': false   // Detected from sync
  },
  show_location_data: {
    '2023': true,   // Always visible
    '2024': true,   // Always visible  
    '2025': false   // Policy-based
  },
  lastLocationCheck: '2025-07-28T10:30:00Z'
}
```

#### 2. Location Detection During Sync
The system automatically detects if location data exists when syncing:
```javascript
// In progressiveSync.js during camp sync
if (type === 'camp' && year === '2025') {
  const camps = await getFromCache('camp', '2025')
  const hasLocations = camps.some(camp => 
    camp.location_string && 
    camp.location_string !== '' && 
    camp.location_string !== 'TBD' && 
    camp.location_string !== 'Unknown'
  )
  updateLocationDataAvailability('2025', hasLocations)
}
```

#### 3. Policy Enforcement
The 2025 visibility policy is automatically enforced:
```javascript
// Development mode: Always show if available
if (import.meta.env.DEV) {
  return true
}

// Production mode: Apply timing policy
const now = new Date()
const buildWeekSunday = new Date(2025, 7, 17) // Aug 17, 2025
if (now >= buildWeekSunday && hasLocationData) {
  // Show camp locations after build week starts
  return true
}
return false
```

### Using the Global State in Components

#### Basic Usage
```javascript
// In a component's script setup
import { shouldShowLocation } from '@/stores/globalState'

// Check if location should be shown for an item
const showLocation = computed(() => shouldShowLocation(item.value))

// In template
<div v-if="showLocation" class="location">
  {{ item.location_string }}
</div>
<div v-else class="location-hidden">
  Location will be revealed closer to the event
</div>
```

#### Advanced Usage with Year-Specific Checks
```javascript
import { canShowLocations, globalState } from '@/stores/globalState'

// Check for specific year
const can2025Locations = computed(() => canShowLocations('2025'))

// Access raw state for debugging
console.log('Location availability:', globalState.location_data_available)
console.log('Location visibility:', globalState.show_location_data)
```

### Component Implementation Examples

#### List View Pattern
```javascript
// ListView.vue example
const displayLocation = computed(() => {
  if (!sortBy.value.includes('location')) return false
  // Let global state determine visibility
  return true // Component always tries to show, state controls actual visibility
})

// In item rendering
const itemLocation = computed(() => {
  if (!shouldShowLocation(item)) {
    return 'Location TBD'
  }
  return getItemLocation(item)
})
```

#### Detail View Pattern
```javascript
// DetailView.vue example
<div class="detail-section">
  <h3>Location</h3>
  <p v-if="shouldShowLocation(item)">
    {{ item.location_string }}
  </p>
  <p v-else class="location-notice">
    <Icon name="clock" />
    Location information will be available closer to the event
  </p>
</div>
```

#### Map View Pattern
```javascript
// MapView.vue example
const getMarkerPosition = (item) => {
  if (!shouldShowLocation(item)) {
    // Return null or center of city for hidden locations
    return null
  }
  return geocodeLocation(item.location_string)
}

// Filter out items without viewable locations
const visibleMarkers = computed(() => 
  items.value.filter(item => shouldShowLocation(item) && item.location_string)
)
```

### Policy Logic Details

#### 2025 Event Timeline
```javascript
// Key dates for location visibility (2025)
const eventDates = {
  apiAvailable: new Date(2025, 7, 3),    // Aug 3: Data available to devs
  buildWeekStart: new Date(2025, 7, 17), // Aug 17: Sunday 12:01am - camps visible
  gatesOpen: new Date(2025, 7, 24),      // Aug 24: Art locations visible
  eventStart: new Date(2025, 7, 25)      // Aug 25: Event officially begins
}
```

#### Visibility Rules
1. **Historical Years (2023-2024)**: Always show all location data
2. **Current Year (2025)**:
   - Before Aug 3: No location data available
   - Aug 3-16: Data cached but hidden from users
   - Aug 17+: Camp locations visible
   - Aug 24+: Art locations visible (when implemented)
3. **Development Mode**: Always show locations if available (for testing)

### Debugging and Testing

#### Debug Helper Function
```javascript
import { debugLocationState } from '@/stores/globalState'

// In development, log current state
debugLocationState()
// Output:
// 🌍 Location Data State: {
//   available: { 2023: true, 2024: true, 2025: true },
//   showable: { 2023: true, 2024: true, 2025: false },
//   lastCheck: '2025-07-28T10:30:00Z'
// }
```

#### Manual State Updates (Dev Only)
```javascript
// Force update for testing
import { updateLocationDataAvailability, updateShowLocationFlag } from '@/stores/globalState'

// Simulate location data becoming available
updateLocationDataAvailability('2025', true)

// Force recalculation of visibility
updateShowLocationFlag('2025')
```

### Best Practices

1. **Always use the helper functions** - Don't check location_string directly
2. **Provide user feedback** - Show clear messages when locations are hidden
3. **Graceful degradation** - Features should work without location data
4. **Consistent messaging** - Use standard text for hidden locations
5. **Test both states** - Verify UI works with locations shown and hidden

### Standard Messages
```javascript
// When locations are hidden
const LOCATION_MESSAGES = {
  tbd: 'Location TBD',
  policy: 'Location will be revealed closer to the event',
  buildWeek: 'Locations available starting Sunday of build week',
  loading: 'Checking location availability...'
}
```

## UI Component System

### Core Components

The app uses a custom UI component system for consistency and maintainability:

#### BaseButton
- **Variants**: primary, secondary, danger, ghost, link
- **Sizes**: sm, md, lg
- **Props**: variant, size, fullWidth, loading, disabled, active, icon, uppercase
- **Usage**: 
  ```vue
  <BaseButton variant="secondary" size="md" @click="handleClick">
    Click Me
  </BaseButton>
  ```

#### BaseCard
- Consistent card styling with header, content, and footer slots
- Used for data display throughout the app

#### BaseSelect
- Custom dropdown to fix Chrome positioning bugs
- Handles keyboard navigation and click-outside
- **Usage**:
  ```vue
  <BaseSelect v-model="selected" :options="options" />
  ```

#### ButtonGroup
- Creates connected button groups with proper borders
- **Directions**: horizontal, vertical
- Automatically handles border radius on first/last buttons
- **Usage**:
  ```vue
  <ButtonGroup direction="vertical">
    <BaseButton>First</BaseButton>
    <BaseButton>Middle</BaseButton>
    <BaseButton>Last</BaseButton>
  </ButtonGroup>
  ```

### Component Best Practices
1. Always use BaseButton instead of native buttons
2. Use ButtonGroup for any set of related buttons
3. Import components from `@/components/ui` index
4. Maintain consistent spacing and sizing

## Common Development Tasks

### Add New View/Route
1. Create component in `/src/views/`
2. Add route in `/src/main.js`
3. Add navigation in `App.vue`
4. Update keyboard shortcuts if needed

### Migrating Components to Global Location State

When updating existing components to use the global location state system:

1. **Remove Direct Location Checks**
   ```javascript
   // OLD - Don't do this
   if (item.location_string) {
     // show location
   }
   
   // NEW - Use global state
   import { shouldShowLocation } from '@/stores/globalState'
   if (shouldShowLocation(item)) {
     // show location
   }
   ```

2. **Update Template Logic**
   ```vue
   <!-- OLD -->
   <span v-if="item.location_string">{{ item.location_string }}</span>
   <span v-else>Location TBD</span>
   
   <!-- NEW -->
   <span v-if="shouldShowLocation(item)">{{ item.location_string }}</span>
   <span v-else>Location will be revealed closer to the event</span>
   ```

3. **Handle Year-Specific Logic**
   ```javascript
   // For components that need year awareness
   import { canShowLocations } from '@/stores/globalState'
   
   const selectedYear = ref('2025')
   const locationsAvailable = computed(() => canShowLocations(selectedYear.value))
   ```

4. **Update Map/Distance Features**
   ```javascript
   // Filter items before processing
   const itemsWithLocations = computed(() => 
     items.value.filter(item => shouldShowLocation(item) && item.location_string)
   )
   ```

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

1. **2025 Data**: Camp locations automatically hidden until August 17, 2025 (per API policy)
2. **Geolocation**: Requires HTTPS in production
3. **Large datasets**: Consider pagination for better performance
4. **Service Worker**: Must be served over HTTPS for PWA features
5. **Location Visibility**: 2025 locations follow strict API timing policies

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

### Release Workflow Best Practices

Based on experience, there are two recommended approaches for releases:

#### Approach A: All-in-One PR (Recommended)
Include everything in your feature branch before creating the PR:
1. Feature implementation code
2. Updated CHANGELOG.md
3. Updated AboutSettings.vue release notes
4. Incremented service worker cache version
5. Any related documentation updates

**Benefits**: Single PR review, atomic deployment, no post-merge cleanup

```bash
# On feature branch
git add -A
git commit -m "feat: Add custom entries with release notes"
gh pr create --title "feat: Add custom entries feature"
# After approval
gh pr merge --merge --delete-branch
```

#### Approach B: Post-Merge Release Updates
Merge feature first, then update release notes:
1. Create and merge feature PR with just the implementation
2. After merge, create a separate commit for release updates
3. Push release updates directly to main

**Benefits**: Clean feature PRs, coordinated multi-feature releases

```bash
# After feature PR is merged
git checkout main && git pull
# Update CHANGELOG.md, AboutSettings.vue, sw.js
git add -A
git commit -m "chore: Release v3.15.0 with custom entries feature"
git push origin main
```

### Common Release Pitfalls & Solutions

#### Uncommitted Changes from Other Work
**Problem**: OpenGraph changes mixed with custom entries feature
**Solution**: Always check `git status` before creating PRs. Stash or commit unrelated changes separately.

```bash
# Before creating PR
git status  # Check for uncommitted changes
git stash   # If unrelated changes exist
# ... create and merge PR ...
git stash pop  # Restore changes after
```

#### Git Workflow Confusion
**Problem**: Complex cherry-picking and branch switching
**Solution**: Keep main branch clean, use feature branches consistently

#### Service Worker Cache Versioning
**Critical**: MUST increment `CACHE_NAME` in `public/sw.js` for EVERY release
```javascript
// Before: const CACHE_NAME = 'ok-offline-v18';
// After:  const CACHE_NAME = 'ok-offline-v19'; // Custom entries feature
```

### Deployment Checklist
Before pushing to main:
- [ ] Ensure main branch is clean (`git status`)
- [ ] Test locally with `npm run build` (preview not needed - starts long-running server)
- [ ] Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format
- [ ] **Update release notes in AboutSettings.vue** - The release notes are hardcoded in `src/components/settings/AboutSettings.vue` in the `releaseNotes` array
- [ ] **Increment service worker cache version** in `public/sw.js` (e.g., `ok-offline-v18` → `ok-offline-v19`)
- [ ] Use conventional commit messages for proper versioning
- [ ] Create comprehensive PR description linking to issues
- [ ] After merge, verify GitHub Actions deployment succeeds

**Important**: Safari and other browsers aggressively cache service workers. Without incrementing the cache version, users won't receive updates.

## Contributing

When making changes:
1. Follow existing code patterns
2. Maintain offline-first principle
3. Test with/without connectivity
4. Update this documentation
5. Add comments for complex logic
6. Use conventional commits for automatic versioning
7. Respect location visibility policies

Remember: This app is designed to work in the harsh conditions of Black Rock City where connectivity is limited or non-existent. Every feature should work offline once data is synced.

## Quick Reference: Global Location State

### Import What You Need
```javascript
import { 
  shouldShowLocation,              // Check single item
  canShowLocations,               // Check by year
  globalState,                    // Raw state access
  updateLocationDataAvailability, // Update detection
  debugLocationState             // Dev debugging
} from '@/stores/globalState'
```

### Common Patterns
```javascript
// Check if location should be shown
if (shouldShowLocation(item)) { /* show */ }

// Get display text
const locationText = shouldShowLocation(item) 
  ? item.location_string 
  : 'Location will be revealed closer to the event'

// Filter items with visible locations
items.filter(item => shouldShowLocation(item))

// Check year availability
if (canShowLocations('2025')) { /* enable feature */ }
```

### Key Dates (2025)
- **Aug 3**: API data available (hidden from users)
- **Aug 17**: Camp locations visible (12:01am Sunday)
- **Aug 24**: Art locations visible (gates open)
- **Aug 25**: Event begins

### Testing
- Dev mode always shows locations if available
- Use `debugLocationState()` to inspect state
- Test with both hidden and visible states

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

## Flexbox Layout Architecture

### Overview
The app uses a nested flexbox layout system to ensure proper height management and scrolling behavior across all views. This architecture was implemented to fix viewport overflow issues and ensure consistent behavior between mobile and desktop.

### Core Layout Structure
```
html (height: 100%)
└── body (height: 100%)
    └── #app (height: 100%, overflow: hidden)
        └── .app-root (height: 100%, flex container)
            └── .app-container (flex: 1, flex container)
                ├── AppHeader (flex-shrink: 0)
                ├── main (flex: 1, overflow: hidden)
                │   └── View Component (height: 100%, flex container)
                │       ├── Fixed Content (flex-shrink: 0)
                │       └── Scrollable Content (flex: 1, overflow-y: auto)
                └── AppFooter (flex-shrink: 0) [desktop only]
```

### Key Principles
1. **Height Inheritance**: Start with `height: 100%` at html/body level
2. **Flex Containers**: Each level uses flexbox for proper space distribution
3. **No 100vh**: Avoid viewport units that don't account for mobile browser chrome
4. **min-height: 0**: Critical on flex children to allow proper shrinking
5. **Overflow Management**: Only the innermost content area should scroll

### Implementation Details

#### App.vue
```css
.app-root {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-container {
  flex: 1; /* Fill remaining space, not height: 100% */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* Critical for nested flexbox */
}

main {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
```

#### View Components Pattern
```css
.view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.fixed-header {
  flex-shrink: 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}
```

### Common Issues and Solutions

1. **36px Overflow**: Caused by using `height: 100%` instead of `flex: 1`
2. **No Scrolling**: Missing `min-height: 0` on flex containers
3. **Double Scrolling**: Multiple nested scrollable areas
4. **Footer Hidden**: Improper flex distribution in parent containers

### Testing Checklist
- [ ] Desktop footer visible at all viewport heights
- [ ] List views scroll properly without body scroll
- [ ] No horizontal overflow on any device
- [ ] Mobile browser chrome doesn't cause layout shift
- [ ] Nested components maintain proper scroll containment

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

## Current Project Status (July 2025)

### ✅ Completed Features
- **Core PWA**: v3.9.1 in production at https://offline.oknotok.com
- **Offline Functionality**: Full offline support with IndexedDB
- **Map & GIS**: Interactive maps with complete BRC data layers
- **Weather Integration**: Apple WeatherKit + OpenWeatherMap fallback
- **Vector Search**: AI-powered search with 3 modes (live in production)
- **Data Management**: Favorites, visits, personal schedule
- **Emergency Features**: Local storage for critical info
- **Mobile UX**: Touch-optimized with recent improvements

### 🔧 Development Environment
- **Frontend Dev**: http://100.104.170.10:8005 (Tailscale IP)
- **API Dev**: http://100.104.170.10:3555/api/v1/ (Tailscale IP)
- **Production**: https://offline.oknotok.com

### 📋 Known Issues
- Double-scrolling on some mobile devices (fix in progress)
- API currently proxied through frontend (dedicated hosting planned)
- Safari requires manual SW version bump for updates

### 🚀 Next Priorities
1. **API Production Deployment** - Move from proxy to dedicated hosting
2. **Mobile UX Fixes** - Resolve double-scrolling issue
3. **Play Wisdom Feature** - Community content sharing (design phase)
4. **Performance Monitoring** - Track vector search usage and metrics
