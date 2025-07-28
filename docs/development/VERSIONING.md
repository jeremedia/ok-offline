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

## Best Practices

1. **Use feature branches** for all development work
2. **Only merge to main** when ready to deploy
3. **Use conventional commits** for the merge commit
4. **Test thoroughly** on feature branch before merging
5. **Update CHANGELOG.md** before merging major features
6. **Keep main branch deployable** at all times
7. **Review changes** before merging to main

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