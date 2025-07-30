# Changelog

All notable changes to OK-OFFLINE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Custom Entries Feature** - Create and manage custom camps, art, and events
  - Floating action button (+) on list views for easy access to add custom entries
  - Dedicated forms for each type (camps, art, events) with appropriate fields
  - Dual-mode location picker supporting both intersection selection and GPS coordinates
  - Visual indicators (✏️ pencil icon) to distinguish custom entries from official data
  - Custom entries persist through API data syncs and refreshes
  - Auto-open functionality for filtered groups containing 5 or fewer items
  - Reusable form component architecture with slot-based customization
  - Full mobile optimization with responsive design
  - Dark theme styling with proper form field appearance
  - Validation for required fields, email addresses, and URLs
  - Custom entry notice in forms explaining local storage

### Fixed
- **Form Styling** - Applied dark theme styling to all form inputs including slotted content
- **Data Persistence** - Fixed DataCloneError when saving Vue reactive objects to IndexedDB
- **Visual Alignment** - Properly centered pencil icon with "CUSTOM ENTRY" badge text

### Changed
- **List View Behavior** - Small filtered groups (≤5 items) now auto-open for better discoverability
- **Storage Service** - Modified to preserve custom entries during API data syncs

### Technical
- Created `customEntries.js` service for CRUD operations on custom data
- Implemented `FloatingActionButton.vue` component with scroll-aware hiding
- Built `FormModal.vue` as base modal component with escape key handling
- Developed `LocationPicker.vue` with intersection/GPS dual mode support
- Used CSS `:deep()` selectors to style slotted form content
- Custom entry IDs follow pattern: `custom-{type}-{timestamp}-{random}`

## [3.12.0] - 2025-07-29

### Added
- **Ultimate Map Enhancement - Phase 1** - Major overhaul of map interface and controls
  - Tabbed control interface organizing controls into Content/Layers/Display tabs
  - Map Info inspector panel with live cursor tracking showing coordinates and BRC address
  - Interactive legend with drag support, minimize functionality, and collision detection
  - Reset View button for quick navigation back to default map position
  - Enhanced keyboard shortcuts for improved map navigation
- **Infrastructure Layer Expansion** - Comprehensive service location mapping
  - Complete infrastructure categorization with alphabetized controls
  - Added DMZ (music zone) and Hell Station (fuel) infrastructure locations
  - Pentagon fence perimeter points with number emojis (1️⃣-5️⃣)
  - Medical infrastructure showing all Rampart locations with accurate coordinates
  - Portos (toilets) - 45 locations displayed as blue polygons with clickable icons
  - Plaza Portals layer - separate layer for 5 plaza entrance points
- **GIS Data Enhancements** - Official data integration and improved visualization
  - Git submodule integration for official GIS data with automatic updates
  - Street outlines layer showing road boundaries with red semi-transparent fill
  - Accurate Temple and Center Camp coordinates from 2025 GIS reference data
  - Optimized street line display with weight reduced from 4px to 1px
- **Location Data Compliance** - Full Burning Man API policy enforcement
  - Countdown timer showing time until location data release (Aug 17, 2025 at 12:01am)
  - Smart control disabling - Camps/Art/Events checkboxes disabled when data unavailable
  - Year-specific handling with different rules for historical vs current year
  - Clear user messaging with warning banner explaining policy

### Fixed
- **Base Map Initialization** - 2025 satellite imagery now enabled by default for new users
- **Infrastructure Toggle Logic** - Markers properly clear when categories are disabled
- **Porto Display Persistence** - Fixed polygons disappearing after street outlines were added
- **Porto Icon Interaction** - Removed CSS preventing click events on porto icons
- **Temple Location Accuracy** - Now using actual GIS coordinates instead of calculations
- **Reference Point Cleanup** - CPNs (Civic Plaza Network points) properly clear when unchecked
- **Map Rotation Controls** - Reset buttons now properly update the map view

### Changed
- **Map Controls Organization** - Infrastructure moved to Content tab, Plazas/CPNs moved to Layers tab
- **Base Map Logic** - Only available for 2025 (disabled for other years)

### Technical
- **Vite Configuration** - Added @ alias resolving to src/ for cleaner imports
- **Component Architecture** - Modular control tabs with persistent state management
- **LocalStorage Integration** - User preferences remembered across sessions
- **UI Polish** - Consistent dark theme styling with Berkeley Mono font

## [3.11.0] - 2025-07-28

### Fixed
- **Map Tile Offline Loading** - Resolved issue where tiles weren't loading when offline
  - Fixed leaflet.offline integration to properly store and retrieve tiles from IndexedDB
  - Tiles now stored with all subdomain variations (a.tile.openstreetmap.org, b.tile.openstreetmap.org, c.tile.openstreetmap.org)
  - Eliminated network requests when offline - all tiles served from local storage
  - Fixed coordinate calculation bug in tile range generation
  - Added complete tile coverage verification (641 tiles for zoom levels 12-17)

### Added
- **API-Hosted Tile Distribution** - Self-hosted map tiles to avoid OpenStreetMap throttling
  - Rails rake task to download and package all BRC tiles into ZIP file
  - API endpoint at `/api/v1/tiles/package.zip` serves 2.24MB tile package
  - Frontend downloads single ZIP instead of 641 individual tile requests
  - Automatic extraction and storage in IndexedDB with proper key formatting
  - Fallback to individual tile downloads if ZIP method fails
- **Enhanced Reset Options** - Added map tile management to development reset page
  - "Clear Map Tiles" option to reset offline tile storage
  - Integrated into "PWA Test Reset" for complete app reset
  - Proper database cleanup with user feedback

## [3.10.0] - 2025-07-28

### Added
- **Global Location Data State Management** - Smart handling of Burning Man's location data policy
  - Per-year location data availability tracking
  - Automatic detection of location data during sync process
  - Policy enforcement for 2025 data (hidden until 3 weeks before event)
  - Development environment always shows locations if available
  - Helper functions for easy component integration
  - Persistent state storage across sessions
- **Enhanced Progressive Sync UI** - Improved visual feedback during data synchronization
  - Consolidated sync steps from 7 to 6 for clearer progress
  - Live count updates showing items downloaded per year
  - Fixed year loading order (2025 → 2024 → 2023)
  - Conditional "locations TBA 3 weeks before event" messages
  - Improved visual hierarchy with better step indicators
- **Location Policy Compliance** - Respects Burning Man API data release schedule
  - Shows location TBA message on sync screen when data unavailable
  - Displays notice on completion screen about upcoming location release
  - Consistent messaging throughout the application
  - Smart date-based visibility rules for production

### Fixed
- **ProgressiveLoader Visual Issues** - Professional UI polish
  - Step numbers now fill full height with borders touching top/bottom
  - Corrected visual weight between step numbers and item counts
  - Fixed count label colors from gold (#FFD700) to secondary text (#ccc)
  - Improved transition timing from 0.3s to 0.2s for snappier feel
  - Better spacing and alignment of progress indicators
- **Console Noise** - Cleaner development experience
  - Silenced all tile download console logs
  - Reduced verbose logging during sync process

### Changed
- **Sync Architecture** - More intelligent data loading
  - Year-aware sync callbacks with proper event emission
  - Integration with global state during data processing
  - Better stage management with clear start/complete events

### Technical
- Created `globalState.js` with Vue 3 reactive state management
- Added comprehensive documentation for state management patterns
- Enhanced architecture documentation with state layer details
- Updated implementation guides for all major components

### Added
- **Vector Search Integration** - AI-powered semantic search capabilities
  - Intelligent semantic search using OpenAI embeddings and pgvector database
  - Three search modes: Keyword (offline), Semantic (online), and Smart hybrid search
  - SearchModeSelector component for intuitive search type switching
  - Enhanced SearchResultItem with similarity scores and improved layout
  - SearchSuggestions component with entity-based autocomplete
  - Vector search service with caching and offline fallback support
  - Progressive enhancement maintains offline-first architecture
- **Precise Camp Location Accuracy** - Complete geocoding system overhaul for navigation-ready positioning
  - Dynamic avenue mapping system handles year-specific naming themes (2024: wonder theme, 2025: sci-fi authors)
  - GIS intersection finding algorithm places camps at exact street corners
  - Accurate avenue distances extracted from GIS data (corrected errors up to 536 feet!)
  - Year-aware geocoding adapts to each year's unique street naming
- **Custom Map Visualization** - Distinctive visual style for better navigation
  - DetailView shows custom red streets on black background with white labels
  - MapView automatically manages basemap based on selected year
  - 2024 GIS data integration for accurate street visualization
  - Street name labels for easy orientation and navigation
- **Smart Basemap Management** - Year-specific map handling prevents confusion
  - 2025: Toggle between OpenStreetMap basemap and custom red/black style
  - 2024 & earlier: Custom style only (basemap disabled to prevent mismatched street names)
  - Visual feedback for disabled controls with explanatory text

### Fixed
- Production API URL for vector search service integration
- Camp locations now appear at exact street intersections instead of approximate positions
- Eliminated confusion from basemap showing wrong year's street names
- Corrected hardcoded avenue distances with accurate GIS measurements

### Changed
- SearchView enhanced with intelligent search mode selection and improved UI
- Search architecture now supports multiple search backends with graceful fallbacks
- Geocoding system now prioritizes GIS intersection finding over calculated positions
- Map styling dynamically adapts based on year and basemap availability
- DetailView includes GIS street layer initialization for accurate positioning

## [3.2.0] - 2025-07-27

### Added
- **Complete Mobile Optimization** - Comprehensive mobile-first design overhaul
  - Touch-friendly bottom navigation with haptic feedback
  - Swipe gestures for horizontal navigation between main views (Map → Camps → Art → Events → Schedule)
  - Pull-to-refresh functionality on mobile devices
  - Mobile-responsive header with streamlined actions
  - Touch targets sized for optimal mobile interaction (44px minimum)
- **Advanced Mobile UX** - Professional mobile interaction patterns
  - Swipe navigation powered by HammerJS with configurable velocity and threshold
  - Mobile-specific layouts that adapt to screen size and orientation
  - Enhanced mobile typography and spacing optimizations
  - Gesture-based interface reducing need for button taps
- **Settings Interface Revolution** - Modular tabbed settings architecture
  - Seven specialized tabs: About, Data Sync, Features, Maps, Implementation, Feedback, Emergency
  - Each tab implemented as independent Vue component for maintainability
  - Unified design system with shared CSS for consistent styling
  - Mobile-responsive tab navigation with horizontal scrolling
- **Enhanced Mobile Components** - Purpose-built mobile interface elements
  - `BottomNav.vue` - Fixed bottom navigation with active state indicators
  - `PullToRefresh.vue` - Native-feeling pull-to-refresh with visual feedback
  - Mobile action buttons with proper touch feedback and accessibility
  - Responsive grid layouts that adapt to mobile constraints

### Changed
- **Mobile-First Navigation** - Complete navigation paradigm shift
  - Desktop retains traditional header navigation
  - Mobile uses bottom navigation for primary actions
  - Year selector moved to desktop-only interface
  - Search and settings become prominent mobile header actions
- **Touch Interaction Design** - Optimized for finger navigation
  - Increased touch target sizes throughout interface
  - Improved button spacing and grouping for thumb accessibility
  - Enhanced visual feedback for touch interactions
  - Reduced cognitive load with simplified mobile layouts
- **Settings Architecture** - From monolithic to modular design
  - Split massive SettingsView into focused component modules
  - Emergency functionality extracted to dedicated component with tabs
  - Data sync operations isolated for better maintainability
  - About section enhanced with comprehensive version history

### Technical
- **Mobile Detection Logic** - Smart responsive behavior
  - Width-based detection for development environments
  - Enhanced touch and user agent detection for production
  - Graceful degradation for non-mobile devices
  - Consistent mobile experience across platforms
- **Component Architecture** - Improved code organization
  - Settings components follow shared CSS design system
  - Modular imports reduce bundle size impact
  - Clear separation of concerns between mobile/desktop interfaces
  - Maintainable codebase with focused component responsibilities

### Dependencies
- **Added HammerJS** - Professional touch gesture library for swipe navigation

## [3.1.1] - 2025-07-27

### Added
- **Auto-Reset Route** - `/reset-now` instantly clears all data and redirects to home
  - Useful for development and testing
  - No confirmation dialog for immediate reset
  - Automatically triggers onboarding flow

### Changed
- **Onboarding Year Selection** - Removed confusing year selector from sync step
  - Sync messaging now clearly states "all Burning Man data (2023-2025)"
  - Progress steps show individual years being downloaded
  - Default navigation year set to 2025 after onboarding
  - Clearer understanding that all data is downloaded regardless

### Fixed
- **Service Worker Cache Busting** - Added version parameter to force updates
- **CLAUDE.md Merge Conflict** - Fixed incomplete merge conflict marker

### Developer
- **Screenshot Handling Directive** - Added mandatory rule for analyzing screenshots in CLAUDE.md

## [3.1.0] - 2025-07-27

### Added
- **Comprehensive Onboarding Experience** - Beautiful multi-step welcome flow for first-time users
  - Step 1: Feature showcase explaining offline-first nature
  - Step 2: Automatic data sync with real-time progress visualization
  - Step 3: Quick start guide with action cards
- **Progressive Data Sync** - Intelligent multi-year download strategy
  - Downloads all years (2023, 2024, 2025) automatically for complete access
  - Prioritizes current year camps first for immediate use
  - Background downloads historical data while users can start exploring
  - Smart caching optimizes ~10-15MB total download
- **Guided Tour System** - Interactive interface tutorials
  - Contextual tooltips and highlights for key features
  - Keyboard navigation support (arrow keys, spacebar, escape)
  - Different tours for map, list, and search views
  - Progressive disclosure without overwhelming new users
- **Enhanced Loading States** - Professional progress feedback
  - ProgressiveLoader component with multiple animation modes
  - Step-by-step progress tracking with real-time updates
  - Rotating tips during long operations
  - Visual progress bars and status indicators
- **Service Worker Optimization** - Faster initial loads
  - Enhanced caching strategies for different resource types
  - Intelligent cache management with automatic cleanup
  - Background updates without blocking UI
  - Persistent storage support for reliability
- **Developer Reset Tool** - `/reset` path for testing onboarding
  - Quick reset options for different test scenarios
  - Status dashboard showing current state
  - Reset log for tracking actions
  - Full reset option for complete fresh start

### Changed
- **Onboarding Flow** - Reduced from 4 steps to 3 for better UX
- **Data Sync** - Now downloads all years automatically instead of just selected year
- **Service Worker** - Re-enabled with enhanced caching strategies
- **Welcome Screen** - Unified sync UI eliminates jarring transitions
- **First-Time Detection** - Smart logic checks for cached data or completion flag

### Fixed
- Service worker registration properly enabled in production
- Safari aggressive caching issues with version bumping
- Jarring panel transitions during onboarding sync
- Import errors in ResetView component

## [2.0.0] - 2025-07-26

### BREAKING CHANGES
- **SECURITY**: Removed all hardcoded API credentials from frontend code
- Weather API integration now requires Rails backend service
- Apple WeatherKit authentication moved to secure server-side proxy

### Added
- Secure Rails API proxy for weather data integration
- Vite development proxy for local Rails backend connection
- Real-time weather and dust forecast for Black Rock City
- Apple WeatherKit integration via secure JWT authentication proxy
- Moon phase data for navigation at Burning Man
- OpenWeatherMap primary weather service with Rails fallback strategy
- Emergency features moved to Settings tab (cleaner navigation)
- Rails API service (ok-offline-api) for server-side weather integration
- CORS-compliant weather data fetching through proxy
- Auto-refresh weather data every 15 minutes
- Detailed weather metrics (temperature, wind, humidity, pressure, visibility)
- 5-day dust forecast with protection recommendations
- Dust level scale and safety tips
- Sun times (sunrise/sunset) for Black Rock City
- Weather data caching for offline use
- Apple WeatherKit data source attribution
- Robust error handling for weather services
- Professional GIS data integration with map rotation capabilities

### Changed
- **SECURITY**: All API credentials now handled server-side only
- Weather services completely refactored to use Rails API endpoints
- Emergency button moved from navigation header to Settings tab
- Dev server port updated to 8005 for proxy configuration
- Enhanced dust forecast view with real weather data
- Improved weather service architecture with secure proxy fallbacks
- Development workflow now requires running Rails backend service

### Fixed
- **SECURITY**: No more exposed API keys in frontend JavaScript
- Console errors from weather API calls
- CORS issues with Apple WeatherKit by implementing Rails backend proxy
- Doubled padding in weather UI components
- Template null reference errors in weather display
- Airport location coordinates updated to accurate GIS data

### Security
- Removed Apple WeatherKit private key from frontend repository
- Implemented secure server-side proxy for all weather API calls
- Eliminated client-side API credential exposure
- Added proper CORS configuration for production deployment

## [1.2.5] - 2025-01-26

### Added
- Pre-enriched event data in static files for better performance
- Environment variable support for API keys (.env file)
- Scripts for data enrichment and processing
- PWA icons in multiple sizes for better device support
- Support for `other_location` field in events

### Changed
- Events are now pre-enriched with location data at build time
- API key moved to environment variables for security
- Removed runtime enrichment to save processing on mobile devices
- Service worker cache version bumped to v3

### Fixed
- Events with custom locations now display correctly
- Unknown location issues for enriched events

## [1.2.4] - 2025-01-26

### Added
- Static data files for offline-first architecture
- Toast notification system for user feedback
- User-friendly error messages for sync failures

### Changed
- Replaced API proxy with static JSON data files
- Removed dependency on live API calls
- Simplified sync process

### Fixed
- CORS issues with Burning Man API
- Toast notification timing issues

## [1.2.3] - 2025-01-26

### Fixed
- Loading states and error handling improvements
- Visual feedback during sync operations

## [1.2.2] - 2025-01-26

### Added
- Loading spinner component with animated feedback
- Skeleton loader component for list views
- Toast notification system for user feedback
- Comprehensive error handling with user-friendly messages
- Retry functionality for failed data loads
- Success notifications for sync operations
- Empty state messages with helpful hints
- Enhanced progress bars with gradient animations

### Changed
- Improved sync progress visualization
- Better error messages for network and API failures
- Enhanced user feedback during operations

### Fixed
- Error states now show actionable messages
- Loading states properly displayed during data fetches

## [1.1.0] - 2025-01-26

### Added
- Comprehensive in-app documentation with tabbed interface
- About tab with version display and build timestamp
- Features tab documenting all app capabilities
- Implementation tab with technical details
- Feedback tab with GitHub issue integration
- Automatic semantic versioning with CI/CD pipeline
- Version display in settings (click OK-OFFLINE header)

### Changed
- Settings view transformed into multi-tab interface
- Updated attribution to Jeremy Roush and Mr. OK of OKNOTOK

### Fixed
- Table HTML structure warnings (added tbody elements)

## [1.0.0] - 2025-01-26

### Added
- Initial release of OK-OFFLINE
- Offline-first Progressive Web App for Burning Man
- Complete data sync for camps, art, and events (2023-2025)
- Interactive map with layer toggles
- Smart lists with sorting and filtering
- Personal schedule builder with conflict detection
- Favorites system across all data types
- Visit tracking with notes for camps
- Emergency contacts storage
- Search functionality across all content
- BRC geocoding for accurate address mapping
- Event location enrichment during sync
- Dust forecast widget
- Keyboard shortcuts for navigation
- PWA installation support
- Dark theme optimized for playa conditions

### Technical
- Built with Vue 3 and Vite
- IndexedDB for offline storage
- Service Worker for PWA functionality
- Leaflet maps integration
- Strict offline-first architecture