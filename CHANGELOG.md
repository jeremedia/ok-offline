# Changelog

All notable changes to OK-OFFLINE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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