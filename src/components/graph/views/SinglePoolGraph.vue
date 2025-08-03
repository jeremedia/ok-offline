<!--
SinglePoolGraph.vue - Single Pool Deep Dive Visualization

Displays entities within a specific pool of the Seven Pools framework.
Entities are arranged using force-directed layout to reveal natural clusters
and relationships within the pool's conceptual space.

This is a THIN component that extends BaseGraphView, providing only:
- Pool-specific data filtering
- Force layout configuration optimized for single pool exploration
- Pool-themed visual styling

Layout Strategy:
- Force-directed layout reveals natural entity clusters
- Node sizing based on entity importance/frequency
- Edge weights show relationship strength
- Pool-specific color theming

Usage:
<SinglePoolGraph
  :data-loader="loadSinglePoolData"
  :pool-name="selectedPool"
  @view-ready="onViewReady"
  @selection-change="onSelectionChange"
/>
-->
<template>
  <BaseGraphView
    ref="baseView"
    view-type="single-pool"
    :data-loader="dataLoader"
    :layout-config="layoutConfig"
    :selection-config="selectionConfig"
    :data-loader-params="dataLoaderParams"
    @view-ready="$emit('view-ready', 'single-pool')"
    @selection-change="$emit('selection-change', $event)"
    @error="$emit('error', $event)"
    @data-loaded="onDataLoaded"
    @layout-complete="onLayoutComplete"
  />
</template>

<script>
import BaseGraphView from './BaseGraphView.vue';
import { computed, ref, watch } from 'vue';

export default {
  name: 'SinglePoolGraph',
  
  components: {
    BaseGraphView
  },
  
  props: {
    /**
     * Function that loads pool-specific entity data
     * Expected to return { nodes: Array, edges: Array }
     */
    dataLoader: {
      type: Function,
      required: true
    },
    
    /**
     * Name of the pool to display
     */
    poolName: {
      type: String,
      required: true,
      validator: (value) => {
        const validPools = ['manifest', 'experience', 'relational', 'practical', 'idea', 'evolutionary', 'emanation'];
        return validPools.includes(value);
      }
    },
    
    /**
     * Maximum number of entities to display
     */
    limit: {
      type: Number,
      default: 500
    },
    
    /**
     * Number of force layout iterations
     */
    layoutIterations: {
      type: Number,
      default: 300
    },
    
    /**
     * Whether to show intra-pool relationships only
     */
    intraPoolOnly: {
      type: Boolean,
      default: true
    }
  },
  
  emits: [
    'view-ready',
    'selection-change',
    'error',
    'pool-changed'
  ],
  
  setup(props, { emit }) {
    // Reference to base view component
    const baseView = ref(null);
    
    // Pool display names
    const poolDisplayNames = {
      manifest: 'Manifest',
      experience: 'Experience',
      relational: 'Relational',
      practical: 'Practical',
      idea: 'Idea/Philosophical',
      evolutionary: 'Evolutionary',
      emanation: 'Emanation'
    };
    
    // Data loader parameters
    const dataLoaderParams = computed(() => ({
      poolName: props.poolName,
      limit: props.limit,
      intraPoolOnly: props.intraPoolOnly
    }));
    
    // Layout configuration for single pool view
    const layoutConfig = computed(() => ({
      algorithm: 'force',  // Use force-directed layout
      iterations: props.layoutIterations,
      preventOverlaps: true,
      // Force layout specific settings
      settings: {
        barnesHutOptimize: true,
        barnesHutTheta: 0.5,
        edgeWeightInfluence: 1,
        gravity: 0.08,
        linLogMode: false,
        outboundAttractionDistribution: false,
        scalingRatio: 10,
        slowDown: 1,
        strongGravityMode: false
      }
    }));
    
    // Selection configuration
    const selectionConfig = computed(() => ({
      enableBridgeSelection: false,  // No bridge entities in single pool
      enablePoolSelection: false,    // No pool nodes in this view
      clearOnStageClick: true,       // Clear selection on empty space
      highlightConnections: true     // Highlight connected entities
    }));
    
    /**
     * Get the display name for the current pool
     */
    const currentPoolDisplayName = computed(() => {
      return poolDisplayNames[props.poolName] || props.poolName;
    });
    
    /**
     * Handle data loaded event
     * Log pool-specific information
     */
    const onDataLoaded = (data) => {
      console.log(`Single Pool [${currentPoolDisplayName.value}]: Loaded ${data.nodes.length} entities, ${data.edges.length} relationships`);
      
      // Data is already filtered by pool and enhanced by the service
    };
    
    /**
     * Handle layout complete event
     */
    const onLayoutComplete = (algorithm) => {
      console.log(`Single Pool [${currentPoolDisplayName.value}]: ${algorithm} layout complete`);
    };
    
    /**
     * Refresh the view when pool changes
     */
    watch(() => props.poolName, async (newPool, oldPool) => {
      if (newPool !== oldPool && baseView.value) {
        emit('pool-changed', { from: oldPool, to: newPool });
        await refresh();
      }
    });
    
    /**
     * Refresh the view
     * Delegated to base view
     */
    const refresh = async () => {
      if (baseView.value) {
        await baseView.value.initializeView();
      }
    };
    
    /**
     * Get current graph statistics
     */
    const getStats = () => {
      if (baseView.value && baseView.value.graph) {
        const graph = baseView.value.graph;
        return {
          pool: props.poolName,
          entities: graph.order,
          relationships: graph.size
        };
      }
      return null;
    };
    
    return {
      // Refs
      baseView,
      
      // Computed
      dataLoaderParams,
      layoutConfig,
      selectionConfig,
      currentPoolDisplayName,
      
      // Methods
      onDataLoaded,
      onLayoutComplete,
      refresh,
      getStats
    };
  }
};
</script>

<style scoped>
/* Single Pool specific styles */
/* Most styling is handled by BaseGraphView */

/* Pool-specific loading message */
:deep(.loading-text) {
  &::after {
    content: ' (Pool Entities)';
    opacity: 0.7;
  }
}

/* Enhanced entity appearance for single pool view */
:deep(.view-type-single-pool) {
  /* Entities should have pool-specific styling */
  .sigma-node {
    transition: transform 0.2s ease;
  }
  
  /* Hover effect for entities */
  .sigma-node:hover {
    transform: scale(1.1);
  }
}

/* Pool-specific color theming could be added here */
/* Each pool could have its own color palette */
</style>