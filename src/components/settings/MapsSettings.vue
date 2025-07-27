<template>
  <div class="tab-content maps-content">
    <h2>Map & GIS Settings</h2>
    
    <div class="maps-section">
      <h3>🗺️ Map Information</h3>
      <p>
        Explore detailed Black Rock City geographic information and mapping features.
      </p>
      
      <router-link to="/settings/map" class="maps-link">
        🔍 View Detailed Map Information →
      </router-link>
      
      <div class="maps-info">
        <h4>What you'll find:</h4>
        <ul>
          <li><strong>BRC Geometry</strong> - City dimensions, street layout, and orientation facts</li>
          <li><strong>GIS Data Sources</strong> - Information about streets, boundaries, and points of interest</li>
          <li><strong>Technical Details</strong> - Coordinate systems, data formats, and update schedules</li>
          <li><strong>Fun Facts</strong> - Interesting details about Black Rock City's unique urban design</li>
        </ul>
      </div>
    </div>

    <div class="maps-section">
      <h3>🧭 Map Controls</h3>
      <p>
        The map view includes advanced controls for exploring Black Rock City:
      </p>
      <ul>
        <li><strong>Layer Toggles</strong> - Show/hide streets, city blocks, trash fence, and points of interest</li>
        <li><strong>City Alignment</strong> - Rotate the map to align gate at bottom, temple at top</li>
        <li><strong>Base Map Toggle</strong> - Show/hide satellite imagery for better visibility</li>
        <li><strong>Interactive Legend</strong> - Understand what each symbol and color represents</li>
      </ul>
    </div>

    <div class="maps-section">
      <h3>📍 GIS Data Features</h3>
      <div class="gis-features-grid">
        <div class="gis-feature">
          <h4>🛣️ Street Network</h4>
          <p>Complete street layout including radial streets (2:00-10:00) and circular avenues (Esplanade-L)</p>
        </div>
        
        <div class="gis-feature">
          <h4>🚧 City Boundary</h4>
          <p>Trash fence perimeter defining the official city limits and safety boundary</p>
        </div>
        
        <div class="gis-feature">
          <h4>🏗️ City Blocks</h4>
          <p>Individual parcels showing camp placement and city organization</p>
        </div>
        
        <div class="gis-feature">
          <h4>📍 Points of Interest</h4>
          <p>Plazas, CPN locations, and other important community spaces</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Maps tab has no interactive functionality - it's purely informational
</script>

<style scoped>
.maps-content {
  max-width: 900px;
}

.maps-section {
  background: #2a2a2a;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

.maps-section h3 {
  margin-top: 0;
  color: #fff;
}

.maps-section p {
  color: #ccc;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.maps-section ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #ccc;
  line-height: 1.8;
}

.maps-link {
  display: inline-block;
  background: #8B0000;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
  margin: 1rem 0;
  font-weight: 500;
}

.maps-link:hover {
  background: #a00000;
  text-decoration: none;
}

.maps-info {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #444;
}

.maps-info h4 {
  color: #fff;
  margin: 0 0 0.75rem 0;
}

.gis-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.gis-feature {
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #444;
}

.gis-feature h4 {
  color: #FFD700;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.gis-feature p {
  margin: 0;
  font-size: 0.9rem;
  color: #aaa;
  line-height: 1.5;
}
</style>