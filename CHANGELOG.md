# Changelog

All notable changes to OK-OFFLINE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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