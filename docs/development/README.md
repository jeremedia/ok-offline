# Development Documentation

This directory contains guides for developers working on OK-OFFLINE.

## 📚 Available Guides

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development setup and workflow guide
- **[UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md)** - Design principles and UI/UX standards  
- **[VERSIONING.md](VERSIONING.md)** - Semantic versioning and release process

## 🚀 Quick Start for Developers

1. **Setup**: Follow [DEVELOPMENT.md](DEVELOPMENT.md) to get your environment ready
2. **Design**: Read [UI_UX_GUIDELINES.md](UI_UX_GUIDELINES.md) before making UI changes
3. **Release**: Understand [VERSIONING.md](VERSIONING.md) for proper version management

## 🛠️ Key Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev -- --host 0.0.0.0 --port 8005

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Development Checklist

Before submitting PRs:
- [ ] Code follows Vue 3 best practices
- [ ] UI changes follow our design guidelines
- [ ] Mobile responsiveness tested
- [ ] Offline functionality preserved
- [ ] Service worker cache version updated if needed
- [ ] Tests pass (when available)
- [ ] Documentation updated

## 🔧 Common Tasks

### Adding a New Feature
1. Create feature branch
2. Implement following existing patterns
3. Test offline functionality
4. Update documentation
5. Submit PR with screenshots

### Debugging Issues
- Check browser console for errors
- Use Vue DevTools for component inspection
- Monitor Network tab for API calls
- Test in multiple browsers
- Verify IndexedDB data

### Performance Optimization
- Lazy load heavy components
- Optimize bundle size
- Use proper caching strategies
- Monitor Core Web Vitals
- Test on low-end devices

---

*Development documentation for OK-OFFLINE contributors*