# Versioning Guide for OK-OFFLINE

OK-OFFLINE uses [Semantic Versioning](https://semver.org/) (SemVer) for version management.

## Version Format

`MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backwards compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backwards compatible (1.0.0 → 1.0.1)

## Automatic Version Bumping

The version is automatically bumped on each push to the main branch based on commit messages:

### Commit Message Conventions

- **Major bump**: Include `[major]` or `BREAKING CHANGE` in commit message
  ```
  feat: [major] Complete redesign of the UI
  ```

- **Minor bump**: Include `[minor]` or start with `feat:`
  ```
  feat: Add bike route planning feature
  ```

- **Patch bump**: Default for all other commits
  ```
  fix: Correct event location display issue
  ```

### Examples

```bash
# Bug fix (patch bump: 1.1.0 → 1.1.1)
git commit -m "fix: Correct event location display issue"

# New feature (minor bump: 1.1.1 → 1.2.0)
git commit -m "feat: Add voice search functionality"

# Breaking change (major bump: 1.2.0 → 2.0.0)
git commit -m "feat: [major] Redesign data sync architecture"
```

## Manual Version Control

If needed, you can manually update the version:

```bash
# Patch bump
npm version patch

# Minor bump
npm version minor

# Major bump
npm version major

# Specific version
npm version 1.2.3
```

## Version Display

The current version is displayed in:
- About tab in Settings (click OK-OFFLINE header)
- Browser console on app load
- Package.json file

## Development Workflow

### Feature Branch Workflow (Recommended)

Since every push to main triggers automatic versioning and deployment, use feature branches for development:

```bash
# 1. Create a feature branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

# 2. Make changes and commit (commit messages don't affect versioning yet)
git add .
git commit -m "WIP: Working on new feature"
git commit -m "refactor: Clean up component logic"
git commit -m "test: Add unit tests"

# 3. Push to feature branch (no deployment triggered)
git push origin feat/your-feature-name

# 4. When ready, ensure final commit uses conventional format
git commit -m "feat: Add amazing new feature"

# 5. Merge to main (this triggers version bump & deployment)
git checkout main
git pull origin main
git merge feat/your-feature-name
git push origin main

# 6. Delete feature branch
git branch -d feat/your-feature-name
git push origin --delete feat/your-feature-name
```

### Branch Naming Conventions

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `style/` - Code style changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Maintenance tasks

Examples:
- `feat/bike-route-planning`
- `fix/event-location-display`
- `docs/api-documentation`

### Working on Multiple Features

```bash
# Create separate branches for each feature
git checkout -b feat/voice-search
# ... work on voice search ...

git checkout -b feat/photo-upload
# ... work on photo upload ...

# Merge them individually when ready
```

### Quick Fixes

For urgent fixes, you can still push directly to main:

```bash
git checkout main
git pull origin main
# Make fix
git commit -m "fix: Critical bug in event display"
git push origin main  # Triggers patch version bump
```

## CI/CD Pipeline

1. **Push to main** → Version bump workflow runs
2. **Version bumped** → Git tag created (e.g., v1.1.1)
3. **Tag created** → Deploy workflow triggered
4. **Deploy complete** → New version live at https://offline.oknotok.com

## Version History

Track version history through:
- Git tags: `git tag -l`
- GitHub releases page
- Commit history with version bump commits
- In-app release notes (Settings → About → View Release Notes)

## Release Preparation Workflow

### Before Creating Your PR

1. **Verify Clean Working Directory**
   ```bash
   git status  # Should show only your feature changes
   # If you have unrelated changes:
   git stash save "Unrelated work"
   ```

2. **Update Release Documentation**
   ```bash
   # Update CHANGELOG.md with your changes
   # Categories: Added, Fixed, Changed, Technical
   
   # Update src/components/settings/AboutSettings.vue
   # Add new release entry to releaseNotes array
   ```

3. **Increment Service Worker Cache** (CRITICAL!)
   ```bash
   # Edit public/sw.js
   # Change: const CACHE_NAME = 'ok-offline-v18';
   # To:     const CACHE_NAME = 'ok-offline-v19'; // Your feature name
   ```

4. **Test Production Build**
   ```bash
   npm run build
   npm run preview  # Optional - starts server, build test usually sufficient
   # Test your feature in production mode (if running preview)
   # Verify service worker updates properly
   ```

### Creating the Pull Request

#### Option 1: All-in-One PR (Recommended)
```bash
# Include everything in one commit
git add -A
git commit -m "feat: Add your feature with release notes"
gh pr create --title "feat: Your feature" --body "
## Summary
- Feature implementation
- Release notes updated
- Service worker cache bumped to vXX

Closes #issue-number
"
```

#### Option 2: Feature First, Release After
```bash
# 1. Create feature PR with just implementation
gh pr create --title "feat: Your feature"
gh pr merge --merge

# 2. After merge, update release docs
git checkout main && git pull
# Update CHANGELOG.md, AboutSettings.vue, sw.js
git commit -m "chore: Release vX.X.X"
git push origin main
```

## Common Pitfalls to Avoid

### 1. Forgetting Service Worker Cache Version
- **Impact**: Users won't get updates (especially Safari)
- **Solution**: Always increment in `public/sw.js`
- **Format**: `ok-offline-vXX` (increment number)

### 2. Mixed Uncommitted Changes
- **Example**: OpenGraph changes mixed with custom entries
- **Solution**: Use `git stash` before creating PRs
- **Recovery**: `git stash pop` after PR is merged

### 3. Release Notes Timing
- **Problem**: Updating notes before version is determined
- **Solution**: Either include in PR or wait for auto-version

### 4. Complex Git Workflows
- **Avoid**: Cherry-picking between branches
- **Avoid**: Updating release notes on feature branch after PR creation
- **Use**: Clean, linear history with feature branches

## Best Practices

1. **Use feature branches** for all development work
2. **Only merge to main** when ready to deploy
3. **Use conventional commits** for automatic versioning
4. **Test production build** before creating PR
5. **Update all release docs together** (CHANGELOG + AboutSettings + sw.js)
6. **Keep main branch clean** - no uncommitted changes
7. **Review the deployment** after merge

### Release Documentation Files
- `CHANGELOG.md` - User-facing change log
- `src/components/settings/AboutSettings.vue` - In-app release notes
- `public/sw.js` - Service worker cache version (CRITICAL!)

### Post-Release Verification
1. Check GitHub Actions for successful deployment
2. Visit https://offline.oknotok.com
3. Open DevTools > Application > Service Workers
4. Verify new cache version is active
5. Check Settings > About for new version number

## Checking Current Version

- In the app: Settings → About tab
- In code: `__APP_VERSION__` global variable
- In package.json: `version` field

## Rollback

If needed, rollback to a previous version:

```bash
git checkout v1.0.0
npm run build
# Deploy the built files
```