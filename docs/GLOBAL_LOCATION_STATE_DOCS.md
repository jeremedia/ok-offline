# Global Location State Documentation Summary

## Overview

This document summarizes the comprehensive documentation created for the new global location state system in the OK-OFFLINE frontend application.

## Documentation Updates

### 1. Main Documentation (CLAUDE.md)

#### Added Feature Section
- **Section 16: Global Location State System** - Complete overview of the centralized location management
- Key features documented:
  - Centralized management across the app
  - Smart policy enforcement for 2025 data
  - Automatic detection during sync
  - Persistent state management
  - Policy timing details

#### Added Implementation Guide
- **Global Location State System** section with:
  - Complete API reference
  - Component implementation examples
  - Policy logic details
  - Debugging and testing guidance
  - Best practices
  - Standard messages

#### Added Quick Reference
- Import guide
- Common patterns
- Key dates for 2025
- Testing tips

#### Updated Sections
- Storage Architecture: Added `location_data_state` to LocalStorage keys
- Known Issues: Updated to reflect location visibility policy
- Contributing: Added requirement to respect location policies

### 2. Technical Architecture (docs/technical/ARCHITECTURE.md)

#### Added State Management Layer
- New layer in architecture diagram for state management
- Detailed explanation of global state store
- State structure documentation
- Key functions reference

#### Enhanced State Management Section
- Comprehensive documentation of location state management
- Purpose and architecture
- State structure with examples
- Integration with existing state patterns

### 3. Implementation Guide (docs/technical/IMPLEMENTATION.md)

#### Added Global State Store Section
- Implementation guidelines
- Code examples for common use cases
- Template usage patterns

#### Added Location Visibility Implementation Section
- Common patterns for different views:
  - List View implementation
  - Map View implementation  
  - Detail View implementation
  - Search Results implementation
- Complete code examples for each pattern

#### Updated Testing Checklist
- Added location visibility testing requirements
- Date-based testing scenarios

### 4. Component Migration Guide

Added comprehensive migration instructions in CLAUDE.md:
- Removing direct location checks
- Updating template logic
- Handling year-specific logic
- Updating map/distance features

## Key Implementation Details

### State Structure
```javascript
{
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

### Core API Functions
- `shouldShowLocation(item)` - Check single item
- `canShowLocations(year)` - Check by year
- `updateLocationDataAvailability(year, hasLocations)` - Update detection
- `debugLocationState()` - Development debugging

### Policy Timeline (2025)
- **Aug 3**: API data available (hidden from users)
- **Aug 17**: Camp locations visible (12:01am Sunday)
- **Aug 24**: Art locations visible (gates open)
- **Aug 25**: Event begins

## Best Practices

1. **Always use helper functions** - Never check location_string directly
2. **Provide user feedback** - Clear messages when locations are hidden
3. **Graceful degradation** - Features work without location data
4. **Consistent messaging** - Use standard text across the app
5. **Test both states** - Verify UI with locations shown and hidden

## Testing Recommendations

1. **Development Mode**: Always shows locations if available
2. **Production Mode**: Test with different dates:
   - Before Aug 3: No data available
   - Aug 3-16: Data cached but hidden
   - Aug 17+: Camp locations visible
3. **Use `debugLocationState()`** to inspect current state
4. **Test all views** with hidden/visible locations

## Summary

The global location state system provides a robust, centralized solution for managing location data visibility across the OK-OFFLINE application. The system automatically enforces Burning Man API policies while providing a seamless user experience and clear feedback when location data is not yet available.

All documentation has been updated to reflect this new system, providing developers with comprehensive guidance for implementation, testing, and maintenance.