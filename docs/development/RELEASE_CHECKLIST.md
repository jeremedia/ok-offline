# Release Checklist for OK-OFFLINE

This checklist ensures smooth, error-free releases to production.

## Pre-Development Checklist

- [ ] Working on a feature branch (not main)
- [ ] Branch name follows convention: `feat/`, `fix/`, `docs/`, etc.
- [ ] Main branch is clean and up-to-date

## Pre-PR Checklist

### 1. Code Quality
- [ ] All features implemented and tested
- [ ] No console.log statements (except intentional ones)
- [ ] Code follows existing patterns and conventions
- [ ] Mobile and desktop viewports tested

### 2. Clean Working Directory
- [ ] Run `git status` - only feature changes present
- [ ] Stash any unrelated work: `git stash save "Description"`
- [ ] No uncommitted files that shouldn't be in PR

### 3. Update Release Documentation

#### CHANGELOG.md
- [ ] Add new section under `## [Unreleased]`
- [ ] Categorize changes:
  - `### Added` - New features
  - `### Fixed` - Bug fixes
  - `### Changed` - Changes to existing functionality
  - `### Technical` - Technical improvements
- [ ] Use bullet points with clear descriptions
- [ ] Include issue numbers where applicable

#### AboutSettings.vue Release Notes
- [ ] Open `src/components/settings/AboutSettings.vue`
- [ ] Add new object to beginning of `releaseNotes` array
- [ ] Include version (will be determined by auto-versioning)
- [ ] Format with emojis for visual appeal:
  ```javascript
  {
    version: '3.15.0',
    date: '2025-07-30',
    added: [
      '✏️ Custom Entries - Create and manage your own camps, art, and events',
      '➕ Floating action button on list views'
    ],
    fixed: [
      '🎨 Dark theme styling issues'
    ],
    changed: [
      '📋 List view behavior improvements'
    ],
    technical: [
      '🏗️ New component architecture'
    ]
  }
  ```

#### Service Worker Cache Version (CRITICAL!)
- [ ] Open `public/sw.js`
- [ ] Find `const CACHE_NAME = 'ok-offline-vXX';`
- [ ] Increment the version number
- [ ] Add a comment describing the release:
  ```javascript
  const CACHE_NAME = 'ok-offline-v19'; // Custom entries feature
  ```

### 4. Test Production Build
```bash
- [ ] npm run build
- [ ] npm run preview (optional - starts long-running server, build test sufficient)
- [ ] Test all new features in production mode (if running preview)
- [ ] Verify service worker updates (check DevTools)
- [ ] Test offline functionality
```

## Creating the Pull Request

### Option A: All-in-One PR (Recommended)
- [ ] Stage all changes: `git add -A`
- [ ] Commit with conventional message: `git commit -m "feat: Your feature"`
- [ ] Create PR with comprehensive description:
  ```bash
  gh pr create --title "feat: Your feature" --body "
  ## Summary
  - Brief description of what this PR does
  - Include all major changes
  
  ## Implementation Details
  - Technical details if relevant
  - Any architectural decisions
  
  ## Testing
  - How the feature was tested
  - Any edge cases considered
  
  ## Release Notes
  - ✅ CHANGELOG.md updated
  - ✅ AboutSettings.vue release notes added
  - ✅ Service worker cache bumped to vXX
  
  Closes #issue-number
  "
  ```

### Option B: Feature First, Release After
- [ ] Create and merge feature PR
- [ ] Switch to main: `git checkout main && git pull`
- [ ] Update release files separately
- [ ] Commit: `git commit -m "chore: Release vX.X.X"`

## Post-PR Checklist

- [ ] PR has been reviewed
- [ ] All CI checks pass
- [ ] No merge conflicts

## Merge Checklist

- [ ] Use merge commit (not squash): `gh pr merge --merge`
- [ ] Delete feature branch: `--delete-branch`
- [ ] Watch GitHub Actions for version bump

## Post-Deployment Checklist

### Verify Deployment
- [ ] Check GitHub Actions - all workflows green
- [ ] Visit https://offline.oknotok.com
- [ ] Open browser DevTools

### Verify Service Worker
- [ ] DevTools > Application > Service Workers
- [ ] New cache version is active
- [ ] Old cache version is deleted
- [ ] No console errors

### Verify Version
- [ ] Settings > About shows new version
- [ ] Click "View Release Notes"
- [ ] Verify your changes are listed

### Test Core Functionality
- [ ] Data sync works
- [ ] Offline mode works
- [ ] New features work in production
- [ ] No regressions in existing features

## Rollback Procedure (If Needed)

1. **Immediate Rollback**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Rollback to Specific Version**
   ```bash
   git checkout v3.14.0  # Previous stable version
   npm run build
   # Deploy the built files
   ```

3. **Fix Forward (Preferred)**
   - Create hotfix branch
   - Fix the issue
   - Follow expedited release process

## Common Issues & Solutions

### Service Worker Not Updating
- **Cause**: Cache version not incremented
- **Fix**: Increment version, force refresh with Shift+Reload

### Release Notes Not Showing
- **Cause**: AboutSettings.vue not updated
- **Fix**: Add release entry, ensure proper formatting

### Version Not Bumping
- **Cause**: Non-conventional commit message
- **Fix**: Use `feat:`, `fix:`, or `chore:` prefixes

### Deployment Fails
- **Cause**: Various (check GitHub Actions logs)
- **Fix**: Review logs, fix issues, push fix to main

## Quick Reference

### Files to Update
1. `CHANGELOG.md` - Change log
2. `src/components/settings/AboutSettings.vue` - Release notes
3. `public/sw.js` - Cache version (CRITICAL!)

### Conventional Commits
- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `chore:` - Maintenance (no version bump)
- `feat: [major]` - Breaking change (major version bump)

### GitHub CLI Commands
```bash
# Create PR
gh pr create --title "feat: Title" --body "Description"

# Merge PR (use --merge, not --squash)
gh pr merge --merge --delete-branch

# Check deployment
gh run list --workflow=deploy.yml --limit=1
```

## Final Reminders

⚠️ **ALWAYS increment service worker cache version**
⚠️ **NEVER push directly to main (except release commits)**
⚠️ **TEST in production mode before releasing**
⚠️ **VERIFY deployment completed successfully**

---

*This checklist helps ensure reliable, professional releases. When in doubt, test more!*