<template>
  <div class="tab-content implementation-content">
    <h2>Technical Implementation</h2>
    
    <div class="impl-section">
      <h3>Architecture</h3>
      <p>
        OK-OFFLINE follows a strict offline-first architecture:
      </p>
      <ul>
        <li>Data synced only through this settings page</li>
        <li>All views load exclusively from cache</li>
        <li>No background API calls</li>
        <li>Events enriched with location data during sync</li>
      </ul>
    </div>

    <div class="impl-section">
      <h3>Tech Stack</h3>
      <ul>
        <li><strong>Vue 3</strong> - Composition API for reactive UI</li>
        <li><strong>Vite</strong> - Fast build tool with HMR</li>
        <li><strong>Vue Router</strong> - Client-side routing</li>
        <li><strong>Leaflet</strong> - Interactive maps</li>
        <li><strong>IndexedDB</strong> - Offline data storage</li>
        <li><strong>Service Workers</strong> - PWA functionality</li>
      </ul>
    </div>

    <div class="impl-section">
      <h3>Data Storage</h3>
      <code>
Database: bm2025-db
├── art (object store)
│   ├── Key: uid
│   └── Index: year
├── camp (object store)
│   ├── Key: uid
│   └── Index: year
└── event (object store)
    ├── Key: uid
    └── Index: year
      </code>
    </div>

    <div class="impl-section">
      <h3>BRC Geocoding</h3>
      <p>
        Converts addresses like "7:30 & E" to coordinates:
      </p>
      <ol>
        <li>Parse clock position and avenue</li>
        <li>Account for 45° city rotation</li>
        <li>Calculate distance from Golden Spike</li>
        <li>Apply trigonometry for lat/lon</li>
      </ol>
    </div>

    <div class="impl-section">
      <h3>Event Enrichment</h3>
      <p>
        During sync, events are enriched with location data:
      </p>
      <ol>
        <li>Match events to camps via <code>hosted_by_camp</code></li>
        <li>Add <code>camp_name</code> and <code>enriched_location</code></li>
        <li>Fall back to <code>other_location</code> if no camp</li>
        <li>Preserve enrichment in cache</li>
      </ol>
    </div>

    <div class="impl-section">
      <h3>Performance</h3>
      <ul>
        <li>Lazy loaded views with code splitting</li>
        <li>Debounced search inputs</li>
        <li>Reactive computed properties</li>
        <li>Minimal bundle size (~500KB)</li>
      </ul>
    </div>

    <div class="impl-section">
      <h3>Contributing</h3>
      <p>
        View the full source code and contribute on GitHub:<br>
        <a href="https://github.com/jeremedia/ok-offline" target="_blank" rel="noopener">
          github.com/jeremedia/ok-offline
        </a>
      </p>
    </div>
  </div>
</template>

<script setup>
// Implementation tab has no interactive functionality - it's purely informational
</script>

<style scoped>
.implementation-content {
  max-width: 900px;
}

.impl-section {
  margin-bottom: 2rem;
}

.impl-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.impl-section ul,
.impl-section ol {
  margin-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.impl-section code {
  display: block;
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  color: #aaa;
  overflow-x: auto;
}

.impl-section a {
  color: #8B0000;
  text-decoration: none;
}

.impl-section a:hover {
  text-decoration: underline;
}
</style>