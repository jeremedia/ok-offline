# OK-OFFLINE Features Documentation

A comprehensive guide to all features in the OK-OFFLINE Burning Man guide app.

## Table of Contents

1. [Core Features](#core-features)
2. [Navigation Features](#navigation-features)
3. [Data Management](#data-management)
4. [Map Features](#map-features)
5. [List Features](#list-features)
6. [Detail View Features](#detail-view-features)
7. [Personal Features](#personal-features)
8. [Utility Features](#utility-features)
9. [PWA Features](#pwa-features)
10. [Keyboard Shortcuts](#keyboard-shortcuts)

## Core Features

### Offline-First Design
- **Full offline functionality** after initial data sync
- **No internet required** for browsing camps, art, and events
- **Service Worker** caches all app assets
- **IndexedDB** stores all data locally
- **Manual sync only** - no automatic background API calls

### Multi-Year Support
- Switch between **2023, 2024, and 2025** data
- Each year's data stored separately
- Year selection persists across sessions
- Sync status shown per year

## Navigation Features

### Main Navigation
- **Map** - Interactive map view
- **Camps** - Browse all theme camps
- **Art** - Browse art installations
- **Events** - Browse all events
- **Search** - Global search across all types
- **Schedule** - Personal event schedule
- **Emergency** - Emergency contacts and info
- **Dust** - Weather and dust forecast

### Quick Navigation
- Click **"OK-OFFLINE"** header to access settings
- **Breadcrumb navigation** in detail views
- **URL-based routing** for bookmarking
- **Back button support** throughout

## Data Management

### Data Sync (Settings Page)
- **Manual sync control** for each year
- **Progress indicators** during sync
- **Last sync time** displayed
- **Sync all years** option
- **Event location enrichment** during sync
- **Error handling** with retry capability

### Data Storage
- **IndexedDB** for structured data
- **LocalStorage** for preferences
- **No cloud sync** - all data stays local
- **Privacy-first** design

## Map Features

### Interactive Map Display
- **Leaflet-based** map centered on Golden Spike
- **Custom markers** for camps, art, and events
- **Popup details** on marker click
- **Zoom controls** for navigation
- **Mobile-friendly** touch controls

### Layer Controls
- Toggle **Camps** visibility
- Toggle **Art** visibility  
- Toggle **Events** visibility
- **Show favorites only** filter
- Layer states persist across sessions

### Map Markers
- **Color-coded** by type:
  - 🟦 Blue markers for camps
  - 🟪 Purple markers for art
  - 🟧 Orange markers for events
- **Click to view** full details
- **Favorites highlighted** with stars

## List Features

### Sorting Options
- **Name** - Alphabetical with letter grouping
- **Location** - By BRC address string
- **Sector** - By clock position (2:00-10:00)
- **Avenue** - By street (Esplanade, A-L)
- **Distance** - From current location (when enabled)

### Filtering
- **Live search** by name
- **Sector filters** (checkboxes)
- **Favorites only** toggle
- **Item count** display
- Filters persist across sessions

### List Enhancements
- **Collapsible section headers**
- **Visit badges** (✓) for visited items
- **Favorite stars** (★/☆) inline
- **Location info** shown for each item
- **Distance displayed** when location enabled

## Detail View Features

### Comprehensive Information
- **All available fields** displayed
- **Description** with full text
- **Location details** with BRC address
- **Contact info** when available
- **URLs** linked and clickable

### Mini-Map
- **Location marker** on map
- **Zoom to location** capability
- **BRC address geocoding** for accurate placement

### Camp Events
- **Events hosted** by the camp listed
- **Add to schedule** buttons
- **Time and date** formatted clearly
- **Event type** indicators

### Action Buttons
- **Toggle favorite** status
- **Mark as visited** 
- **Add notes** about your experience
- **View on main map** link

## Personal Features

### Favorites System
- **Star any item** to save as favorite
- **Filter views** to show only favorites
- **Persistent storage** across sessions
- **Quick toggle** in lists and details
- **Favorite count** displayed

### Schedule Builder
- **Add/remove events** from personal schedule
- **Conflict detection** for overlapping times
- **Day-by-day view** with tabs
- **Time-sorted** event display
- **Schedule summary** with counts
- **Export schedule** functionality
- **Clear schedule** option

### Visit Tracking
- **Mark visited** camps and art
- **Timestamp** automatically recorded
- **Personal notes** for each visit
- **Visit badges** in list views
- **Edit notes** anytime

### Emergency Information
- **Emergency contacts** storage (up to 3)
- **Medical information** fields
- **Allergies** list
- **Medications** list
- **Blood type** field
- **Special instructions** text
- **Local storage only** for privacy

## Utility Features

### Global Search
- **Search all types** simultaneously
- **Filter by type** (camps/art/events)
- **Paginated results** (load more)
- **Navigate to details** from results
- **Highlight search terms**

### Location Services
- **Get current location** button
- **Distance calculations** to all items
- **Sort by distance** option
- **Distance display** in lists
- **Works offline** once location obtained

### Dust Forecast
- **5-day forecast** display
- **Current conditions** card
- **Dust level indicators**:
  - 🟢 Clear (0-1)
  - 🟡 Moderate (2-3)
  - 🟠 High (4-5)
  - 🔴 Extreme (6+)
- **Protection tips** for each level
- **Mock data** for demonstration

### Keyboard Shortcuts
- **1-8** - Quick navigation to sections
- **Cmd/Ctrl + K** - Focus search in search view
- **F** - Toggle favorites filter
- **L** - Toggle layers (map view only)
- **/** - Show shortcuts help

## PWA Features

### Progressive Web App
- **Install as app** on devices
- **Home screen icon** support
- **Offline capability** via Service Worker
- **App-like experience** on mobile
- **Splash screen** on launch

### Performance
- **Fast loading** with Vite bundling
- **Code splitting** for efficiency
- **Lazy loading** of views
- **Optimized assets** and fonts
- **Minimal bundle size**

### Responsive Design
- **Mobile-first** approach
- **Touch-friendly** controls
- **Adaptive layouts** for all screens
- **Dark theme** throughout
- **Berkeley Mono** font for readability

## Technical Features

### Data Enrichment
- **Event locations** enriched from camp data
- **Camp names** added to events
- **Automatic during sync** process
- **Preserves enrichment** offline

### BRC Geocoding
- **Convert addresses** like "7:30 & E" to coordinates
- **Accurate placement** on maps
- **45° city rotation** accounted for
- **Special locations** supported (Center Camp, Temple)

### State Management
- **Vue 3 Composition API** for reactivity
- **LocalStorage** for preferences
- **IndexedDB** for data
- **URL-based routing** state
- **Persistent UI state** (collapsed sections, etc.)

### Error Handling
- **Graceful degradation** when offline
- **Redirect to settings** when no data
- **User-friendly messages**
- **Retry capabilities** for sync
- **No silent failures**

## Usage Tips

### First Time Setup
1. Click "OK-OFFLINE" header
2. Choose year and click "Sync Now"
3. Wait for sync to complete
4. Start browsing offline!

### Best Practices
- Sync data while on good WiFi
- Enable location before going offline
- Star your must-see camps/events
- Build your schedule in advance
- Add emergency contacts

### Troubleshooting
- If data missing: Go to Settings and sync
- If map not loading: Check year selection
- If search slow: Try filtering by type
- If location fails: Check browser permissions

## Privacy & Security

### Data Privacy
- **No account required**
- **No personal data uploaded**
- **All data stored locally**
- **No analytics or tracking**
- **Emergency info encrypted locally**

### Permissions
- **Location**: Optional, for distance features
- **Storage**: Required for offline functionality
- **Network**: Only for initial sync

## About

OK-OFFLINE was created by Jeremy Roush and brought to you by Mr. OK of OKNOTOK. It's designed to work reliably in the harsh conditions of Black Rock City where connectivity is limited or non-existent.

For updates and contributions, visit: https://github.com/jeremedia/ok-offline