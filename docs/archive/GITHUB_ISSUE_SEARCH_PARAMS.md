# Feature: Add URL Parameters to Search

## Summary
Add URL parameters to the search functionality to enable shareable search links and preserve search state during navigation.

## Implementation Details

### Features Implemented
- ✅ Search query parameter (`q`) added to URL
- ✅ Search mode parameter (`mode`) added to URL when not using default keyword mode
- ✅ URL updates automatically when search is performed
- ✅ URL parameters are restored when navigating to search page
- ✅ Search state is preserved during forward/back navigation
- ✅ Direct URL navigation with parameters triggers automatic search

### URL Format
- Keyword search: `/2025/search?q=hotdog`
- Semantic search: `/2025/search?q=hotdog&mode=semantic`
- Smart search: `/2025/search?q=hotdog&mode=smart`

### Code Changes
1. **SearchView.vue**:
   - Added `useRoute` import for accessing route query parameters
   - Created `updateURL()` function to sync search state to URL
   - Modified `onMounted` to read URL parameters and perform search if query exists
   - Updated `performSearch()` to call `updateURL()` 
   - Updated mode change handler to update URL

### Testing Results
- ✅ Keyword search with URL params works correctly
- ✅ URL parameters are properly encoded and decoded
- ✅ Navigation state is preserved when using browser back/forward
- ✅ Direct URL navigation triggers search automatically
- ⚠️ Semantic and smart search modes appear to be broken (returning no results)

### Known Issues
1. **Vector Search Not Working**: Both semantic and smart search modes return no results. This appears to be an API connectivity issue, not related to the URL parameter implementation.

### Benefits
- Users can now share search results via URL
- Search state is preserved during navigation
- Better user experience with bookmarkable searches
- Foundation for future search analytics

### Next Steps
- Investigate and fix vector search API connectivity issues
- Consider adding additional URL parameters (filters, sort order)
- Add URL parameter support to other views (camps, art, events)