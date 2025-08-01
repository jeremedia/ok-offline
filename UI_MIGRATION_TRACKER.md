# UI Migration Tracker - Phase 3

## Overview
This document tracks the migration of ~100 button elements across 15+ components to the standardized BaseButton component.

## Migration Status Legend
- ⬜ Not Started
- 🟨 In Progress  
- ✅ Completed
- ❌ Blocked/Issue

## Component Migration Checklist

### 1. BottomNav.vue
**File**: `/src/components/BottomNav.vue`
**Priority**: HIGH (Primary navigation)

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Map nav | 3-4 | .nav-item | BaseButton variant="ghost" | ✅ |
| Camps nav | 5-6 | .nav-item | BaseButton variant="ghost" | ✅ |
| Art nav | 7-8 | .nav-item | BaseButton variant="ghost" | ✅ |
| Events nav | 9-10 | .nav-item | BaseButton variant="ghost" | ✅ |
| Schedule nav | 11-12 | .nav-item | BaseButton variant="ghost" | ✅ |

**Total**: 5 buttons (All migrated)

### 2. AppHeader.vue
**File**: `/src/components/layout/AppHeader.vue`
**Priority**: HIGH (Always visible)

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Desktop Nav (8 items) | 19-27 | .nav-btn | BaseButton variant="ghost" | ✅ |
| Status Dot | 33-37 | .status-dot | BaseButton variant="ghost" custom | ✅ |
| Mobile Search | 43 | .mobile-action-btn | BaseButton variant="secondary" | ✅ |
| Mobile Menu | 49 | .mobile-action-btn | BaseButton variant="secondary" | ✅ |

**Total**: 11 buttons (All migrated)

### 3. ListControls.vue
**File**: `/src/components/ListControls.vue`
**Priority**: HIGH (Used in all list views)

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Clear Search | 14-22 | .clear-search-btn | BaseButton variant="ghost" icon="×" | ✅ |
| Filters Toggle | 46-53 | .filters-btn | BaseButton variant="secondary" | ✅ |
| Clear All | 58-65 | .clear-btn | BaseButton variant="ghost" icon="×" | ✅ |
| Sectors All | 80-86 | .filter-btn | BaseButton variant="ghost" | ✅ |
| Sectors None | 88-94 | .filter-btn | BaseButton variant="ghost" | ✅ |
| Event Types All | 114-120 | .filter-btn | BaseButton variant="ghost" | ✅ |
| Event Types None | 121-127 | .filter-btn | BaseButton variant="ghost" | ✅ |
| Favorites Toggle | 146-152 | .favorites-toggle | BaseButton variant="secondary" | ✅ |
| Location Toggle | 153-161 | .location-toggle | BaseButton variant="secondary" | ✅ |
| Sector Filters | (multiple) | .filter-btn | BaseButton variant="ghost" | ⬜ |
| Event Type Filters | (multiple) | .filter-btn | BaseButton variant="ghost" | ⬜ |

**Total**: 11+ buttons (9 migrated, 2 dynamic remaining)

### 4. SearchResultItem.vue
**File**: `/src/components/search/SearchResultItem.vue`
**Priority**: HIGH (Core search feature)

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Favorite Button | 11-18 | .favorite-btn | BaseButton variant="ghost" icon | ✅ |
| Entity Tags | 34-44 | .entity-tag | BaseButton variant="ghost" size="sm" | ✅ |

**Additional**: Consider migrating .search-result-item to BaseCard
**Total**: 2+ buttons per item (All migrated)

### 5. MapControlTabs.vue
**File**: `/src/components/map/MapControlTabs.vue`
**Priority**: MEDIUM

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Collapse Button | 7-12 | .collapse-btn | BaseButton variant="ghost" icon | ✅ |
| Tab Buttons (3x) | 17-25, 212-220 | .tab-button | BaseButton variant="ghost" | ✅ |
| Rotation Presets (2) | 182-187 | .rotation-preset-btn | BaseButton variant="secondary" | ✅ |
| Reset View | 200-205 | .reset-view-btn | BaseButton variant="primary" | ✅ |

**Total**: 7 buttons (All migrated)

### 6. SearchOptions.vue
**File**: `/src/components/search/SearchOptions.vue`
**Priority**: MEDIUM

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Collapse Button | 4-9 | .collapse-btn | BaseButton variant="ghost" icon | ✅ |
| Search Mode Buttons (3) | 19-29 | .mode-btn | BaseButton variant="ghost" active | ✅ |
| Search Everything | 34-41 | .filter-btn | BaseButton variant="ghost" active | ✅ |
| Filter Buttons (5) | 42-52 | .filter-btn | BaseButton variant="ghost" active | ✅ |

**Total**: 9 buttons (All migrated)

### 7. FormModal.vue
**File**: `/src/components/FormModal.vue`
**Priority**: MEDIUM

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Close Button | 8-10 | .close-btn | BaseButton variant="ghost" icon="×" | ✅ |
| Cancel Button | 18-19 | .btn-secondary | BaseButton variant="secondary" | ✅ |
| Save Button | 20-23 | .btn-primary | BaseButton variant="primary" | ✅ |

**Total**: 3 buttons (All migrated)

### 8. MobileMenu.vue
**File**: `/src/components/layout/MobileMenu.vue`
**Priority**: MEDIUM

| Element | Line | Current Class | Target | Status |
|---------|------|---------------|--------|--------|
| Close Button | 13-15 | .close-menu-btn | BaseButton variant="ghost" icon="×" | ✅ |
| Infrastructure Nav | 53-56 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |
| Weather Nav | 57-60 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |
| Search Nav | 61-64 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |
| About Nav | 70-73 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |
| Features Nav | 74-77 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |
| Settings Nav | 78-81 | .menu-nav-btn | BaseButton variant="secondary" | ✅ |

**Total**: 7 buttons (All migrated)

### 9. Additional Components

#### MapLegend.vue & MapInfo.vue
- Collapse buttons (1 each) | ⬜

#### SearchModeSelector.vue  
- Mode selection buttons (3) | ⬜

#### ScheduleView.vue
- Day buttons (8) | ✅
- Clear button (1) | ✅
- Export button (1) | ✅
- Share button (1) | ✅
- Remove buttons (multiple) | ✅

#### InfrastructureView.vue
- Category filter buttons (~5) | ⬜
- Collapse buttons (1) | ⬜

#### GuidedTour.vue
- Close button (1) | ✅
- Navigation buttons (3) | ✅

## Migration Progress Summary

| Component | Total Buttons | Migrated | Remaining | Progress |
|-----------|--------------|----------|-----------|----------|
| BottomNav | 5 | 5 | 0 | 100% |
| AppHeader | 11 | 11 | 0 | 100% |
| ListControls | 11+ | 9 | 2+ | 82% |
| SearchResultItem | 2+ | 2+ | 0 | 100% |
| MapControlTabs | 7 | 7 | 0 | 100% |
| SearchOptions | 9 | 9 | 0 | 100% |
| FormModal | 3 | 3 | 0 | 100% |
| MobileMenu | 7 | 7 | 0 | 100% |
| ScheduleView | 12 | 12 | 0 | 100% |
| Others | 8+ | 8 | 0+ | 100% |
| **TOTAL** | **82+** | **77** | **5+** | **94%** |

## Migration Process for Each Component

1. **Import BaseButton**: Add `import { BaseButton } from '@/components/ui'`
2. **Replace Elements**: Change `<button>` to `<BaseButton>`
3. **Apply Props**: 
   - `variant`: primary, secondary, danger, ghost, link
   - `size`: sm, md, lg
   - `icon`: For icon-only buttons
   - `uppercase`: Set to false if needed
   - `loading`: For async operations
   - `disabled`: For state management
4. **Remove CSS**: Delete old button styles
5. **Test**: Verify functionality and appearance
6. **Update Tracker**: Mark as completed in this document

## Notes

- Some components may have dynamic buttons (generated in loops)
- Consider creating custom button variants if patterns emerge
- Test each migration across all 4 themes
- Check mobile responsiveness after migration
- Update component tests if they exist

## Next Steps

1. Start with HIGH priority components
2. Migrate one component at a time
3. Commit after each component
4. Update this tracker after each migration
5. Create PR when a logical group is complete