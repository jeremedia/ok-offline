# Changelog

All notable changes to OK-OFFLINE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Toast Notifications** - User feedback for favorites management
  - Shows confirmation when adding/removing favorites
  - Theme-aware colors that adapt to current theme selection
- **Mobile Theme Selector** - Easy theme switching on mobile devices
  - Added theme dropdown to mobile menu
  - Instant theme switching without navigation

### Fixed
- **Mobile Detail View Polish** - Refined spacing and layout
  - Tightened header padding with proper border separator
  - Fixed map container margins for consistent spacing
  - Optimized favorite star alignment without expanding line height
  - Styled back-to-list button with proper theme colors
  - Reduced map controls padding for more compact layout
- **Toast Theme Support** - Fixed toast colors to use theme CSS variables
  - Background now uses `--color-bg-elevated` for consistency
  - Status colors adapt to each theme (OKNOTOK, Sparkle, Khaki, Mush)

### Changed
- **Mobile UX Enhancements** - Major improvements to mobile interface and navigation
  - MapBottomSheet now properly positioned above bottom navigation
  - Tabs moved to bottom for better thumb accessibility
  - Swipe down gesture to close bottom sheet
  - Map nav button toggles controls when already on map view
- **Map Control Improvements** - Enhanced map interface and controls
  - Desktop map controls now scroll properly when content is long
  - Reset Map button moved to Display tab for better organization
  - Map remembers and restores user's zoom, center, and rotation (24hr cache)
  - Reset Map shows minimal view: streets and trash fence only, basemap off
  - Fractional zoom support (0.001 snap) for perfect trash fence fit
  - Removed default Leaflet zoom controls for cleaner interface
- **Infrastructure Layer Fixes** - Proper layer management
  - Fixed Porto pins not being removed when infrastructure unchecked
  - Fixed trash fence visibility with bright red styling
  - All layer checkboxes properly update when map is reset

### Fixed
- **Desktop Scrolling Architecture** - Complete refactor of scrolling system
  - Eliminated double-scrolling issues with proper PWA layout
  - Fixed body scrolling - now using fixed viewport architecture
  - Main content area properly sized with flexbox without padding hacks
- **Mobile Layout Issues** - Resolved spacing and sizing problems
  - Fixed mobile header height from 93px to proper 60px
  - Eliminated white gap between content and bottom nav
  - MapBottomSheet now fills content area with proper flex layout
  - Fixed map panels using container bounds instead of viewport
- **Component Architecture** - Improved maintainability
  - Decomposed App.vue into AppHeader, AppFooter, and MobileMenu components
  - Fixed navigation routes missing year parameter
  - Fixed art detail links using wrong route (/arts/ → /art/)
  - AppFooter now desktop-only as intended
  - BottomNav uses flexbox instead of fixed positioning

### Changed
- **Map Reset Behavior** - More intuitive default view
  - Shows only essential layers (streets and trash fence)
  - Disables basemap for striking black background
  - All checkboxes properly reflect visual state
  - Zooms to fit trash fence with minimal padding

## [3.22.0] - 2025-08-01

### Added
- **Complete Theme System Overhaul** - Professional 4-theme design system for all UI components
  - OKNOTOK Theme: Dark red/gold classic camp theme
  - Sparkle Pony Theme: Light Barbie pink theme with bright magical colors
  - Khaki Theme: Desert earth tones optimized for bright sunlight readability
  - Mush Love Theme: Dark psychedelic theme with electric lime accents
  - Dynamic theme switching with instant visual feedback across all components
  - Proper contrast ratios ensuring readability in all lighting conditions
  - Theme-aware overlays, shadows, and transparency effects
  - Consistent accent colors that adapt to each theme's personality

### Fixed
- **Theme Contrast Issues** - Resolved low contrast problems across all themes
  - Fixed tab buttons and search controls using proper `textInverse` colors on colored backgrounds
  - OKNOTOK theme now uses white text on red backgrounds instead of dark text
  - Mush Love theme uses electric lime text on purple backgrounds for psychedelic pop
  - All active states now have proper contrast ratios for accessibility
- **Hardcoded Color References** - Eliminated all hardcoded color values for complete theme consistency
  - Replaced 15+ instances of `--color-dark-red` with `--color-primary` throughout the app
  - Updated 10+ instances of `--color-gold` with `--color-accent` for proper theme adaptation
  - SearchView, App navigation, and settings components now fully theme-aware
  - Infrastructure views and about pages use theme variables instead of hardcoded colors
- **RGBA Color Values** - Modernized all transparency effects to use theme variables
  - Map controls, shadows, and overlays now adapt to each theme's color palette
  - Search entity backgrounds and hover states use theme-appropriate alpha values
  - Log message backgrounds and icon shadows properly themed
  - DetailView marker and popup styling consistent across all themes
- **Select Dropdown UI** - Modern dropdown arrow implementation with proper spacing
  - Added custom SVG dropdown arrow using `appearance: none` for cross-browser consistency
  - Fixed cramped caret positioning with proper right-side padding (0.5rem from edge)
  - Eliminated animation issues on hover with separated background properties
  - Enhanced arrow visibility with larger size (1.25rem) and proper stroke weight
- **Component Style Consistency** - Normalized styling patterns across settings and search components
  - DataSyncSettings and AppearanceSettings now use shared CSS architecture
  - SearchModeSelector and SearchOptions have consistent button styling and contrast
  - Settings shared CSS properly handles all theme variations
  - Unified button styling with proper `textInverse` usage on colored backgrounds

### Changed
- **Theme Architecture** - Complete CSS variable system for maintainable theming
  - All components now use semantic theme variables instead of hardcoded values
  - Theme service dynamically applies all color variations including transparency effects
  - Background overlays adapt to light vs dark themes (purple for Sparkle, brown for Khaki, black for dark themes)
  - Interactive states (hover, active, focus) properly themed across all components

### Technical
- **Detail View Polish** - Comprehensive enhancements to camp, art, and event detail pages
  - Collapsible CAMP EVENTS section with lazy loading and event count display
  - Shows "CAMP EVENTS (20)" format with expand/collapse functionality
  - Only loads events when section is expanded for better performance
  - Remembers open/closed state per camp using localStorage
  - Gold-colored expand/collapse indicator matching theme
  
- **Detail View Map Improvements** - Enhanced mini-map experience for better usability
  - Fixed scroll wheel zoom conflicts with page scrolling
  - Added -45° rotation for proper Burning Man orientation (gate at bottom)
  - Converted to non-interactive static view for smooth scrolling
  - Added manual zoom controls (+/-) that maintain marker centering
  
- **Detail View Layout Enhancements** - Improved information organization
  - Grouped related fields on single lines for better space usage
  - Camp items: Hometown, Location, and Camp Size on one line
  - Art items: Hometown and Location on one line
  - Event items: Event Type and Location on one line
  - Added item type icons to headers (🏕️ camps, 🎨 art, 🎪 events)
  - Increased icon size for better visibility
  - Flexbox layout with no wrapping for consistent display

### Added
- **PWA Icon System Overhaul** - Complete redesign of all app icons using AI-powered generation
  - Implemented gpt-image-1 model support with OpenAI Responses API
  - Uses existing OKNOTOK logo as reference for consistent branding
  - Generated new app icons in all required sizes (16x16 to 1024x1024)
  - Created new social media preview images maintaining brand consistency
  - Desert/playa themed background textures on all icons
  - Transparent background support for better app icon appearance
  - Added IconViewer component at /icon_viewer to display all image assets
  - Shows icon usage, sizes, and meta tag examples for easy reference

### Changed
- **Image Generation Script** - Modernized to use OpenAI SDK and latest models
  - Rewritten generate-pwa-images.js to use Responses API
  - Added image reference capability for brand consistency
  - Support for both gpt-image-1 (default) and dall-e-3 models
  - Automatic base64 encoding and decoding of images
  - Better error handling and progress feedback

### Added
- **Interactive Entity Discovery** - Transform static entity tags into a powerful discovery system
  - Click any entity tag in search results to find all related camps, art, and events
  - Entity tags display global counts showing total occurrences (e.g., "music (411)")
  - Smart sorting by relevance - most frequent entities in current results appear first
  - Popular Entities section with trending tags for quick discovery
  - Entity Breakdown showing counts across all entity types
  - Clean entity search UI with "Top 20 of 1,387 Music Themes" header
  - URL state management for shareable entity searches (?entity=music)
  - Support for both old and new API entity formats
  - Visual feedback with dark theme compatible colors
  - Smooth scroll-to-top when initiating new searches

- **Enhanced Search UI** - Comprehensive improvements to search interface and user experience
  - Infrastructure search type with search and sort capabilities
  - "Everything" filter with smart toggle behavior (selects only clicked item when all selected)
  - Persistent filter preferences saved in localStorage and restored on page load
  - Total items searched count displayed alongside results ("20 results of 432 found in 2,847 items")
  - Auto-submit search functionality when page loads with query parameter
  - Auto-rerun search when changing between Keyword/Semantic/Smart modes
  - Dynamic placeholder text reflecting selected filters ("Search everything..." or "Search camps and art...")
  - Auto-focus search input when empty on page load
  - Subtle inner shadow styling for search input fields
  - Collapsible search options panel matching infrastructure-intro style
  - Horizontal button group layout for mode and filter controls
  - Mobile-optimized icon-only filter buttons with proper touch targets
  - Decomposed search UI into logical, reusable components

### Fixed
- **Search Mode Filter Bug** - Fixed critical issue where changing search modes disabled all filters
  - Removed code that deselected all filters when switching between keyword/semantic/smart modes
  - Added validation to ensure at least one filter is always selected
  - Prevents deselecting the last active filter with clear user feedback
  - Filters now properly persist across search mode changes
  
- **Search Interface** - Multiple UI and functionality improvements
  - Fixed loading spinner CSS conflict causing entire container to rotate
  - Corrected HDR screen color issues by reducing red brightness by 25%
  - Updated all border colors to match new dark red theme
  - Removed redundant "Results from cache" status message
  - Fixed v-model prop binding errors in SearchOptions component
  - Removed excess padding and margins from search interface elements
  - Cleaned up search modes info styling and spacing

### Changed
- **Search Architecture** - Modular component design for better maintainability
  - Created SearchInput.vue for mobile search input handling
  - Created UnifiedSearchBar.vue for desktop search experience  
  - Created SearchOptions.vue for collapsible mode and filter controls
  - Updated SearchModeSelector.vue with new dark red color variables
  - Implemented CSS variables for consistent dark red theming
  - Changed Smart search icon from ⚡ to 🚀 for better visual distinction
  - Uppercased all button text for consistent design language

### Technical
- **Component Architecture** - Clean separation of concerns and improved code organization
  - Modular search components with proper event emission patterns
  - CSS variables for consistent color theming across components
  - Responsive design with separate mobile and desktop layouts
  - LocalStorage integration for persistent user preferences
  - Smart toggle logic for filter interactions

## [3.16.0] - 2025-07-30

### Added
- **Infrastructure Navigation Section** - New INFRA main navigation featuring comprehensive information about all core Burning Man organization projects
  - 13 infrastructure projects documented with historical context, civic purpose, and operations
  - Educational content for both new and experienced burners
  - Detailed pages for: The Man, Temple, Center Camp, Airport, Medical Services, Rangers, DPW, Arctica, DMZ, Hell Station, Facilities, Perimeter, and Placement
  - Interactive cards with icons and category organization
  - Tabbed detail views with Overview, History, Operations, Legal, and Fun Facts sections
  - Mini-map integration showing infrastructure locations
  - Related links to official Burning Man resources
  - Mobile-responsive design with single-column layout on small screens
  - Search functionality across all infrastructure items
  - Distance-based sorting when location services enabled
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
- **Mobile Navigation Overhaul** - Complete redesign of mobile navigation for better UX
  - Hamburger menu (≡) replacing settings icon with slide-out panel
  - Access to all missing navigation items: Infrastructure, Weather, Search, Year selector
  - Smooth animations with overlay and background scroll prevention
  - Button group pattern for search and hamburger buttons
  - Golden accent colors throughout menu (YEAR label, bullets, links)
  - Integrated button groups with no padding between sections
  - Version display at bottom of Settings & Info section
  - Features link added to Settings & Info (ordered: About, Features, Settings)
  - Touch-optimized with 44px minimum touch targets
  - iOS PWA safe area handling
- **Bottom Navigation Redesign** - Unified design system for mobile tab bar
  - Background color matched to top header (#333)
  - Tab treatment matching infrastructure detail view styling
  - Active items use full red background instead of top border
  - Hover states with subtle red tint
  - Uppercase text with increased font weight and letter spacing
  - Improved visual hierarchy and contrast

### Fixed
- **Form Styling** - Applied dark theme styling to all form inputs including slotted content
- **Data Persistence** - Fixed DataCloneError when saving Vue reactive objects to IndexedDB
- **Visual Alignment** - Properly centered pencil icon with "CUSTOM ENTRY" badge text
- **Mobile Menu Scroll Lock** - Fixed body scroll prevention on subsequent menu opens using nextTick
- **Hamburger Icon Centering** - Corrected vertical alignment with line-height adjustment
- **Link Contrast** - Changed all settings panel links from dark red to gold for better readability

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