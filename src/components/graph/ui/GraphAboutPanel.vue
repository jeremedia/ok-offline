<!-- GraphAboutPanel.vue - Context-sensitive help panel for the graph -->
<!-- This component displays different explanatory content based on the current view mode -->
<!-- It helps users understand what they're seeing and how to interact with the graph -->
<template>
  <div class="about-panel">
    <!-- Bridge Entities View (Clusters Mode) -->
    <div v-if="viewMode === 'clusters'">
      <h4>🌉 Bridge Entities - Enliteracy in Action</h4>
      <p>
        This demonstrates how the dataset has become <strong>literate</strong> about 
        Burning Man culture by showing the most powerful <strong>bridge entities</strong> - 
        concepts that create meaning across multiple pools.
      </p>
      
      <p><strong>What you're seeing:</strong></p>
      <ul class="bridge-explanation">
        <li>
          <strong>Large nodes:</strong> Bridge entities sized by "bridge power" - 
          how well they connect different pools
        </li>
        <li>
          <strong>Small background nodes:</strong> The seven pools of enliteracy
        </li>
        <li>
          <strong>Golden/Accent colored:</strong> Most powerful bridges (4+ pools)
        </li>
        <li>
          <strong>Lines:</strong> Show which pools each bridge connects
        </li>
      </ul>
      
      <p>
        <strong>Bridge Power Formula:</strong><br>
        <code>Pool_Count × √Frequency × Cross_Pool_Centrality</code>
      </p>
      
      <p>
        Click any bridge to explore its connections across the knowledge graph. 
        This reveals how the dataset understands cultural interconnections that 
        span traditional boundaries.
      </p>
    </div>
    
    <!-- Single Pool View -->
    <div v-if="viewMode === 'pool'">
      <h4>{{ poolDisplayName }} Pool Deep Dive</h4>
      <p>
        Exploring the <strong>{{ selectedPool }}</strong> pool with 
        {{ nodeCount.toLocaleString() }} entities. Node size reflects how 
        frequently each concept appears in the Burning Man knowledge base.
      </p>
      <p>
        <strong>Connections:</strong> Lines show relationships between concepts - 
        thicker lines indicate stronger associations.
      </p>
    </div>
    
    <!-- Entity Neighborhood View -->
    <div v-if="viewMode === 'entity'">
      <h4>Entity Neighborhood</h4>
      <p v-if="!entitySearch.trim()">
        Enter an entity name to explore its connections across all pools.
      </p>
      <p v-else>
        Showing connections for "<strong>{{ entitySearch }}</strong>" within 
        2 degrees of separation. The red center node is your search target.
      </p>
      <p>
        <strong>Colors:</strong> Each node is colored by its pool classification. 
        <strong>Distance:</strong> Shows how closely related each concept is to your search.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GraphAboutPanel',
  
  props: {
    // Current view mode ('clusters', 'pool', or 'entity')
    viewMode: {
      type: String,
      required: true,
      validator: (value) => ['clusters', 'pool', 'entity'].includes(value)
    },
    
    // Selected pool name (for pool mode)
    selectedPool: {
      type: String,
      default: 'experience'
    },
    
    // Entity search query (for entity mode)
    entitySearch: {
      type: String,
      default: ''
    },
    
    // Number of nodes in current view
    nodeCount: {
      type: Number,
      default: 0
    }
  },
  
  computed: {
    // Format pool name for display
    poolDisplayName() {
      if (!this.selectedPool) return '';
      return this.selectedPool.charAt(0).toUpperCase() + this.selectedPool.slice(1);
    }
  }
};
</script>

<style scoped>
/* About Panel - explains current view */
.about-panel {
  position: absolute;
  bottom: 4rem;
  left: 1rem;
  max-width: 400px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.about-panel h4 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: var(--color-text-primary);
  font-weight: 600;
}

.about-panel p {
  margin: 0.75rem 0;
  line-height: 1.5;
}

.about-panel strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Bridge explanation list */
.bridge-explanation {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0;
}

.bridge-explanation li {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
  position: relative;
  line-height: 1.5;
}

.bridge-explanation li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
}

/* Code block for formula */
code {
  display: inline-block;
  background: var(--color-bg-base);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-accent);
  margin-top: 0.25rem;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .about-panel {
    position: static;
    margin: 0.5rem;
    max-width: none;
    order: -1; /* Show above graph on mobile */
    font-size: 0.8rem;
  }
  
  .about-panel h4 {
    font-size: 1rem;
  }
  
  .bridge-explanation li {
    font-size: 0.8rem;
    margin: 0.4rem 0;
  }
}
</style>