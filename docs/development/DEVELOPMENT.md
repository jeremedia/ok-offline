# Development Guide

Quick reference for working on OK-OFFLINE with CI/CD enabled.

## Quick Start

```bash
# Start dev server
npm run dev

# Create feature branch
git checkout -b feat/my-feature

# Work and commit freely
git add .
git commit -m "WIP: Working on feature"

# When ready to deploy
git commit -m "feat: Complete my feature"
git checkout main
git merge feat/my-feature
git push  # Auto-deploys to production!
```

## Current Tech Debt & Polish Opportunities

### High Priority Polish
1. **Loading States**
   - Add skeletons/spinners during data sync
   - Show progress for initial page loads
   - Better feedback when switching years

2. **Error Handling**
   - User-friendly error messages
   - Retry mechanisms for failed syncs
   - Offline detection improvements

3. **Performance**
   - Lazy load map markers (currently loads all)
   - Virtual scrolling for long lists
   - Image optimization for PWA icon

4. **Mobile UX**
   - Touch gestures for map
   - Swipe navigation between views
   - Better mobile keyboard handling

### Medium Priority
1. **Search Enhancements**
   - Search history
   - Search suggestions
   - Filter by event type

2. **Map Features**
   - Clustering for dense areas
   - My location marker
   - Distance circles

3. **Data Validation**
   - Handle missing location data gracefully
   - Validate sync data integrity
   - Better null checks

### Nice to Have
1. **Animations**
   - Page transitions
   - List item animations
   - Map marker animations

2. **Accessibility**
   - ARIA labels
   - Screen reader support
   - High contrast mode

3. **Developer Experience**
   - Unit tests
   - E2E tests
   - Storybook for components

## Common Tasks

### Add a Loading State
```vue
<script setup>
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await loadData()
  loading.value = false
})
</script>

<template>
  <div v-if="loading" class="loading">
    <div class="spinner"></div>
  </div>
  <div v-else>
    <!-- Content -->
  </div>
</template>
```

### Add Error Handling
```javascript
try {
  await syncData()
} catch (error) {
  console.error('Sync failed:', error)
  // Show user-friendly message
  showError('Unable to sync data. Please check your connection.')
}
```

### Test Offline Behavior
1. Open DevTools → Network tab
2. Set to "Offline" 
3. Test all features
4. Ensure graceful degradation

### Debug on Mobile
```bash
# Use ngrok for HTTPS tunnel
ngrok http 8000

# Or use local network
npm run dev -- --host
# Access via phone: http://[your-ip]:8000
```

## Before Merging to Main

- [ ] Test offline functionality
- [ ] Check mobile responsiveness
- [ ] Update CHANGELOG.md if significant
- [ ] Use conventional commit for version bump
- [ ] Review console for errors
- [ ] Test build locally: `npm run build && npm run preview`

## Useful Commands

```bash
# Check current version
cat package.json | grep version

# See recent deployments
gh run list --limit 5

# Create and switch to feature branch
git checkout -b feat/new-feature

# See all feature branches
git branch -a | grep feat/

# Clean up merged branches
git branch --merged | grep -v main | xargs git branch -d
```

## Remember

- Every push to main = new version + deployment
- Use feature branches for all work
- Keep commits atomic and focused
- Test edge cases (no data, offline, slow network)
- The app must work offline-first!