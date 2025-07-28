# UI/UX Guidelines: World-Class Design Excellence

*Principles for creating exceptional user experiences that agents can apply systematically*

## Core Philosophy

### The Designer's Mindset
When working on UI/UX, **assume the persona of a world-class designer and UX expert**. This means:

- **Question every design decision**: Does this improve the UI? Does it serve the user?
- **Seek gestalt coherence**: Do elements work together as a unified system?
- **Maintain critical eye**: What needs adjusting, tightening, or resolving?
- **Think holistically**: Consider the entire user journey, not just individual components

### The Three Questions Framework
Before implementing any change, ask:
1. **Does this change improve the UI?**
2. **Does the UI as a whole have a gestalt feeling?** 
3. **Does it cohere as a unified system?**

## Visual Hierarchy Principles

### 1. Information Architecture
- **Primary elements**: Bold, larger, prominent positioning
- **Secondary elements**: Normal weight, smaller, supporting role
- **Tertiary elements**: Subtle, contextual, minimal visual weight

**Example**: In group headers, the label (A, B, C) should be bold and prominent, while counts (123) should be normal weight and smaller.

### 2. Typography Harmony
- **Match font sizes** when elements have equal importance
- **Create contrast** when establishing hierarchy
- **Maintain consistent spacing** using 8px grid rhythm
- **Align text purposefully** (left for scanning, right for secondary info)

### 3. Parent-Child Relationships
- **Use indentation** to show content hierarchy
- **Align child elements** with parent disclosure arrows
- **Create visual breathing room** between hierarchical levels

## Interactive Design Excellence

### 1. Contextual Actions
- **Enable actions only when meaningful**
  - "All" button: Disabled when all selected
  - "None" button: Disabled when none selected
- **Provide immediate feedback** for user actions
- **Show state changes** in real-time

### 2. Button Design Patterns
- **Group related actions** with connected borders
- **Use consistent hover states** matching brand colors (#8B0000)
- **Implement proper disabled states** with reduced opacity (0.6) and `cursor: not-allowed`
- **Maintain touch-friendly targets** (minimum 44x44px on mobile)

### 3. Progressive Disclosure
- **Start collapsed** to maximize content space on mobile
- **Remember user preferences** with localStorage
- **Show disclosure indicators** (▶/▼ arrows)
- **Provide state feedback** (active filter counts)

## Layout & Composition

### 1. Information Balance
- **Left side**: Primary actions and controls
- **Right side**: Status information and counts
- **Center**: Content and data
- **Create breathing room** with consistent spacing

### 2. Mobile-First Principles
- **Optimize for thumb navigation** on mobile devices
- **Provide fallback interactions** for desktop (hover states)
- **Use responsive breakpoints** meaningfully (< 600px for mobile)
- **Prioritize content** over chrome on small screens

### 3. Spacing Rhythm
- **Use 8px base unit** for consistent spacing
- **Apply multiples** (8px, 16px, 24px, 32px) systematically
- **Maintain vertical rhythm** in typography
- **Create visual groupings** with whitespace

## Component Design Standards

### 1. Filter Systems
```css
/* Proper indentation for parent-child relationship */
.filter-content {
  padding-left: 2rem; /* Align with disclosure arrow */
}

/* Smart button groups */
.button-group {
  display: flex;
}
.filter-btn-left {
  border-radius: 4px 0 0 4px;
  border-right: none;
}
.filter-btn-right {
  border-radius: 0 4px 4px 0;
}

/* Disabled states */
.filter-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### 2. List Headers
```css
/* Primary/secondary typography balance */
.group-label {
  font-weight: bold;
  font-size: 1.4rem; /* Prominent */
}
.group-count {
  font-weight: normal;
  font-size: 1rem; /* Secondary */
  margin-left: auto; /* Right-aligned */
}
```

### 3. Hover States
```css
/* Brand-consistent interactive feedback */
.interactive-element:hover {
  background-color: #8B0000; /* Brand red */
  color: #fff;
  border-radius: 4px;
  transition: all 0.2s ease;
}
```

## Color & Interaction Language

### 1. Brand Color Palette
- **Primary Red**: `#8B0000` (hover states, active elements)
- **Background Dark**: `#2a2a2a` (panels, cards)
- **Border Subtle**: `#444` (dividers, outlines)
- **Text Primary**: `#fff` (main content)
- **Text Secondary**: `#ccc` (labels)
- **Text Tertiary**: `#999` (supporting info)

### 2. Interaction States
- **Default**: Neutral colors, clear affordances
- **Hover**: Brand red background, white text
- **Active**: Maintained hover state
- **Disabled**: Reduced opacity, no-cursor
- **Focus**: Outline or border highlight

### 3. Transition Standards
```css
transition: all 0.2s ease;
```
Use consistent 0.2s transitions for state changes.

## Accessibility Guidelines

### 1. Touch Targets
- **Minimum size**: 44x44px for mobile taps
- **Adequate spacing**: 8px minimum between targets
- **Clear affordances**: Obvious what's clickable

### 2. Visual Indicators
- **State communication**: Show current state clearly
- **Progress feedback**: Loading states, counts, confirmations
- **Error handling**: Clear messaging for failures

### 3. Keyboard Navigation
- **Tab order**: Logical flow through interface
- **Focus indicators**: Visible focus states
- **Escape routes**: Ways to cancel or go back

## Implementation Methodology

### 1. Screenshot-Driven Development
Always use this two-step process:
```javascript
// Step 1: Take screenshot
playwright_screenshot(name: "descriptive-name")
// Step 2: IMMEDIATELY read the file
Read(file_path: "../../Downloads/[screenshot-filename].png")
```

### 2. Critical Analysis Protocol
After each screenshot, analyze using this structure:
1. **Overall Layout**: What is the general structure?
2. **Visual Hierarchy**: What draws attention first?
3. **Information Flow**: How does the eye move through content?
4. **Interactive Elements**: What's clickable and obvious?
5. **Visual Issues**: Anything broken, misaligned, or jarring?
6. **Mobile Considerations**: Touch-friendly and responsive?

### 3. Iterative Refinement
- **Implement core functionality** first
- **Add visual polish** systematically
- **Test across viewports** (mobile, tablet, desktop)
- **Validate interaction patterns** work as expected
- **Refine based on visual analysis** of screenshots

## State Management Patterns

### 1. User Preferences
```javascript
// Save collapsed states per context
localStorage.setItem(`filtersCollapsed_${type}`, JSON.stringify(state))

// Load with fallback defaults
const saved = localStorage.getItem(`filtersCollapsed_${type}`)
const state = saved ? JSON.parse(saved) : { sectors: true, eventTypes: true }
```

### 2. Smart Computed Properties
```javascript
// Contextual button states
const allSelected = computed(() => 
  selected.value.length === available.value.length
)
const noneSelected = computed(() => 
  selected.value.length === 0
)
```

### 3. Real-time Feedback
- **Update counts immediately** when filters change
- **Show state in UI** (active filter counts)
- **Provide instant feedback** for all user actions

## Testing & Validation

### 1. Visual Coherence Checklist
- [ ] Typography sizes create clear hierarchy
- [ ] Spacing follows 8px rhythm consistently  
- [ ] Colors create unified brand experience
- [ ] Interactive elements have obvious affordances
- [ ] Disabled states are clearly differentiated
- [ ] Hover states work on desktop, don't break mobile

### 2. Functional Validation
- [ ] All interactive elements respond appropriately
- [ ] State persistence works across sessions
- [ ] Loading states provide clear feedback
- [ ] Error states guide user toward resolution
- [ ] Mobile touch targets are adequately sized

### 3. Gestalt Assessment
- [ ] Interface feels cohesive and purposeful
- [ ] Elements work together, not in isolation
- [ ] Information architecture guides user naturally
- [ ] Visual hierarchy supports task completion
- [ ] Overall experience feels polished and professional

## Advanced Patterns

### 1. Progressive Enhancement
Start with mobile-optimized base experience, enhance for desktop:
```css
/* Mobile-first base */
.element {
  padding: 0.5rem;
}

/* Desktop enhancements */
@media (min-width: 600px) {
  .element:hover {
    background: #8B0000;
  }
}
```

### 2. Content-First Design
- **Maximize content space** on mobile
- **Collapse secondary UI** by default
- **Provide easy access** to controls when needed
- **Remember user preferences** for expanded/collapsed states

### 3. Micro-interactions
- **Smooth transitions** for state changes
- **Immediate feedback** for user actions
- **Subtle animations** that enhance usability
- **Consistent interaction language** across components

## Code Quality Standards

### 1. CSS Organization
```css
/* Component styles grouped logically */
.component {
  /* Layout properties */
  display: flex;
  align-items: center;
  
  /* Visual properties */
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  
  /* Typography */
  font-size: 1rem;
  font-weight: normal;
  color: #ccc;
  
  /* Interactive properties */
  cursor: pointer;
  transition: all 0.2s ease;
}

.component:hover {
  background: #8B0000;
  color: #fff;
}
```

### 2. Semantic HTML
- Use proper elements for their intended purpose
- Provide meaningful aria-labels for interactive elements
- Structure content with logical heading hierarchy
- Group related elements appropriately

### 3. Performance Considerations
- Minimize layout thrashing with efficient CSS
- Use transform for animations instead of position changes
- Implement virtual scrolling for large lists
- Optimize images and assets for mobile bandwidth

---

## Summary

**World-class UI/UX design requires**:
1. **Critical thinking** about every design decision
2. **Systematic application** of visual hierarchy principles  
3. **Contextual intelligence** in interactive design
4. **Cohesive visual language** that unifies the experience
5. **User-centered approach** that prioritizes task completion
6. **Technical excellence** in implementation details

**Remember**: Great design is not about following rules blindly, but understanding principles deeply enough to apply them thoughtfully in service of user goals.

When in doubt, ask: *"Does this make the user's life easier and more delightful?"*