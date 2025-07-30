# Search UI Polish and HDR Color Improvements

## Summary
Enhanced the search interface with improved mobile UX, dynamic placeholders, and color adjustments for HDR screens.

## Changes Made

### 1. Infrastructure Search Type
- Added Infrastructure as a searchable type alongside Camps, Art, Events, and Notes
- Integrated with existing search functionality

### 2. Search Everything Filter
- Added "Search Everything" button as the first filter option
- Implements smart toggle behavior:
  - When all filters selected: clicking deselects all
  - When some unselected: clicking selects all
  - When everything is selected and user clicks individual filter: deselects all others

### 3. Filter Persistence
- Filter preferences now saved to localStorage
- Automatically restored on page load

### 4. Enhanced Results Display
- Shows total items searched alongside results count
- Example: "432 results found from 3,567 items"

### 5. Auto-submit Improvements
- Search auto-submits when loaded with query parameter
- Re-runs search when changing between Keyword/Semantic/Smart modes

### 6. Mobile UI Enhancements
- Mode buttons now display icons inline with text (not stacked)
- Filter buttons show icon-only on mobile (except "Search Everything")
- All buttons properly sized at 44x44px for touch targets
- Updated Smart mode icon from ⚡ to 🚀

### 7. Layout Improvements
- Moved filter bar to top of search page
- Removed redundant "Search Everything" header
- Filter bar now full width and left-aligned
- Removed unnecessary margins and spacing

### 8. Dynamic Placeholder Text
- Search input placeholder reflects current filter selection:
  - "Search everything..." when all selected
  - "Search camps..." for single filter
  - "Search camps and art..." for two filters
  - "Search camps, art, and events..." for 3+ filters
  - "Select a filter to search..." when none selected

### 9. Visual Enhancements
- Added subtle inner shadow to search inputs
- Auto-focus search field on page load (desktop only due to iOS restrictions)
- All button text now uppercase for consistency

### 10. HDR Screen Color Adjustments
- Reduced red color brightness by 25% for better HDR display
- Changed from #8B0000 to #680000 throughout
- Updated both backgrounds and borders for consistency
- Added CSS variable --color-dark-red for maintainability

### 11. Bug Fixes
- Fixed loading spinner rotating entire container (CSS class conflict)
- Removed redundant "Results from cache" message
- Fixed color consistency across all red UI elements

## Technical Details
- Updated CSS variables in global.css
- Modified SearchView.vue with improved layout and functionality
- Enhanced SearchModeSelector.vue for mobile display
- All changes maintain backward compatibility

## Testing Notes
- Tested on mobile and desktop viewports
- Verified filter persistence across sessions
- Confirmed HDR color improvements
- Auto-focus works on desktop (iOS limitations acknowledged)
EOF < /dev/null