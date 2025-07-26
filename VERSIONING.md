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

## CI/CD Pipeline

1. **Push to main** → Version bump workflow runs
2. **Version bumped** → Git tag created (e.g., v1.1.1)
3. **Tag created** → Deploy workflow triggered
4. **Deploy complete** → New version live

## Version History

Track version history through:
- Git tags: `git tag -l`
- GitHub releases page
- Commit history with version bump commits

## Best Practices

1. **Use conventional commits** for clear version bumping
2. **Test thoroughly** before pushing to main
3. **Document breaking changes** in commit messages
4. **Update CHANGELOG.md** for significant releases

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