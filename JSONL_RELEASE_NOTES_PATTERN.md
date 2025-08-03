# JSONL Release Notes Pattern

## Overview

This document describes the JSONL (JSON Lines) pattern implemented for release notes management. This approach solves the context pollution problem where adding one new release required reading and outputting 800+ lines of hardcoded data.

## The Problem

**Before JSONL:**
- Release notes stored as hardcoded array in `AboutSettings.vue` 
- Adding one release = reading 800+ lines + outputting 800+ lines
- Massive context waste for simple additions
- File becomes unwieldy as releases accumulate

**After JSONL:**
- Each release = one line in `release-notes.jsonl`
- Adding one release = append one line
- Context efficient - never need to read full history
- Scales linearly, not exponentially

## Implementation

### File Structure
```
public/data/release-notes.jsonl
```

### JSONL Format
Each line is a complete JSON object representing one release:

```jsonl
{"version":"3.25.0","date":"2025-08-02","added":["🚨 Emergency-Ready Khaki Theme"],"fixed":["🖥️ Desktop scrolling fixes"],"changed":[],"security":[],"breaking":[],"technical":[]}
{"version":"3.24.0","date":"2025-08-01","added":["📱 Mobile enhancements"],"fixed":["🔧 Various fixes"],"changed":[]}
```

### Required Fields
- `version` (string): Semantic version (e.g., "3.26.0")
- `date` (string): ISO date format (e.g., "2025-08-03")

### Optional Arrays
Include empty arrays for unused categories:
- `added`: New features with emoji prefixes
- `fixed`: Bug fixes with emoji prefixes
- `changed`: Behavior changes with emoji prefixes
- `security`: Security improvements
- `breaking`: Breaking changes
- `technical`: Technical/internal changes

### Service Integration

**Service File:** `src/services/releaseNotesService.js`

**Key Functions:**
- `loadReleaseNotes(limit)`: Loads and parses JSONL file
- Caching for performance
- Error handling for malformed lines
- Newest-first ordering (reverses file order)

**Component Usage:**
```javascript
import { loadReleaseNotes } from '@/services/releaseNotesService'

const releaseNotes = ref([])
const loadingReleases = ref(false)

const openReleaseNotes = async () => {
  if (releaseNotes.value.length === 0) {
    loadingReleases.value = true
    releaseNotes.value = await loadReleaseNotes(20) // Recent 20
    loadingReleases.value = false
  }
}
```

## Adding New Releases

### The Efficient Way
For new releases, simply append ONE line to the JSONL file:

```bash
echo '{"version":"3.26.0","date":"2025-08-03","added":["🌊 Seven Pools Knowledge Graph - Interactive visualization"],"fixed":["🐛 Fixed search bug"],"changed":[],"security":[],"breaking":[],"technical":[]}' >> public/data/release-notes.jsonl
```

### Template for New Releases
```bash
echo '{"version":"X.X.X","date":"YYYY-MM-DD","added":["🎨 Feature with emoji prefix"],"fixed":["🐛 Bug fix"],"changed":[],"security":[],"breaking":[],"technical":[]}' >> public/data/release-notes.jsonl
```

### What NOT to Do
❌ **Don't** read the entire file and rewrite it  
❌ **Don't** edit existing lines (breaks the append-only pattern)  
❌ **Don't** manually sort (service handles newest-first ordering)  

## Benefits

### Context Efficiency
- **Before**: Read 800+ lines, output 800+ lines to add one release
- **After**: Append literally one line

### Scalability  
- File grows linearly (one line per release)
- Service loads only recent N releases (default: 20)
- No exponential complexity growth

### Maintainability
- Clear separation of concerns
- Easy to debug (one release per line)
- Simple to migrate/backup individual releases

### Performance
- Lazy loading only when modal opens
- Caching prevents repeated fetches
- Can limit UI to recent releases

## File Management

### Rotation Strategy
If file becomes very large (100+ releases), consider:
1. Archive old releases to `release-notes-archive.jsonl`
2. Keep recent 50 releases in main file
3. Update service to optionally load archive

### Backup
Simple to backup individual releases:
```bash
# Backup last 5 releases
tail -5 public/data/release-notes.jsonl > backup-recent.jsonl
```

### Migration
Moving from hardcoded to JSONL:
1. Extract hardcoded data to JSONL format
2. Update service to load JSONL
3. Remove hardcoded array
4. Test loading and display

## Error Handling

### Service Level
- Graceful handling of malformed JSON lines
- Console warnings for parse errors
- Continues processing other lines
- Returns empty array on fetch failure

### Component Level
- Loading states while fetching
- Empty states when no data
- Error boundaries for network issues

## Future Enhancements

### Possible Improvements
1. **Pagination**: Load releases in chunks
2. **Search**: Search within release notes
3. **Filtering**: Filter by type (added/fixed/changed)
4. **Export**: Export to other formats
5. **Validation**: Schema validation for new releases

### Build Integration
Could integrate with build process:
1. Validate JSONL syntax during build
2. Generate static HTML from JSONL
3. Optimize/minify JSONL file

## Release Process Integration

This pattern integrates with the deployment process:

1. **Update CHANGELOG.md** - Official changelog
2. **Update AboutSettings.vue** - Version display (if needed)
3. **Update sw.js** - Service worker cache version  
4. **Append to release-notes.jsonl** - User-facing release notes

### Example Release Command
```bash
# Add new release (one line!)
echo '{"version":"3.26.0","date":"2025-08-03","added":["🌊 Seven Pools Knowledge Graph"],"fixed":[],"changed":[],"security":[],"breaking":[],"technical":[]}' >> public/data/release-notes.jsonl

# Commit all release files
git add CHANGELOG.md public/data/release-notes.jsonl public/sw.js public/data/features.json
```

## Testing

### Validate JSONL Format
```bash
# Check each line parses as valid JSON
while IFS= read -r line; do
  echo "$line" | jq . >/dev/null || echo "Invalid JSON: $line"
done < public/data/release-notes.jsonl
```

### Test Service Loading
```javascript
// In browser console
import { loadReleaseNotes } from '/src/services/releaseNotesService.js'
const releases = await loadReleaseNotes(5)
console.log(releases)
```

## Summary

The JSONL pattern provides:
- **Efficiency**: No more context pollution when adding releases
- **Scalability**: Linear growth, not exponential complexity  
- **Simplicity**: Append one line vs editing massive arrays
- **Performance**: Lazy loading with caching
- **Maintainability**: Clear, debuggable format

This pattern should be used for any similar data that grows over time and would otherwise create context pollution during updates.