<!--
PoolOverviewGraph.vue - Seven Pools Knowledge Graph Overview

Displays bridge entities that demonstrate "enliteracy" by spanning multiple pools.
The Seven Pools are positioned semantically from concrete (bottom) to abstract (top),
with bridge entities dynamically positioned based on their pool connections.

This is a THIN component that extends BaseGraphView, providing only:
- Pool-specific layout configuration (semantic positioning)
- Bridge entity visualization settings
- Smooth layout animation support

Layout Strategy:
- Seven Pools: Fixed semantic positions representing the spectrum of knowledge
- Bridge Entities: Positioned based on "center of gravity" of connected pools
- Edge Highlighting: Visual emphasis on cross-pool connections
- Bridge Power: Node size reflects breadth and depth of pool connections

Usage:
<PoolOverviewGraph
  :data-loader="loadPoolOverviewData"
  @view-ready="onViewReady"
  @selection-change="onSelectionChange"
/>
-->
<template>
  <BaseGraphView
    ref="baseView"
    view-type="pool-overview"
    :data-loader="dataLoader"
    :layout-config="layoutConfig"
    :selection-config="selectionConfig"
    :data-loader-params="dataLoaderParams"
    @view-ready="$emit('view-ready', 'pool-overview')"
    @selection-change="$emit('selection-change', $event)"
    @error="$emit('error', $event)"
    @data-loaded="onDataLoaded"
    @layout-complete="onLayoutComplete"
  />
</template>

<script>
import BaseGraphView from './BaseGraphView.vue';
import { useGraphLayouts } from '../composables/useGraphLayouts.js';
import { computed, ref } from 'vue';

export default {
  name: 'PoolOverviewGraph',
  
  components: {
    BaseGraphView
  },
  
  props: {
    /**
     * Function that loads bridge entity data
     * Expected to return { nodes: Array, edges: Array }
     */
    dataLoader: {
      type: Function,
      required: true
    },
    
    /**
     * Whether to enable smooth animated layout
     */
    enableSmoothLayout: {
      type: Boolean,
      default: false
    },
    
    /**
     * Minimum number of pools a bridge must span
     */
    minPools: {
      type: Number,
      default: 2
    },
    
    /**
     * Maximum number of bridge entities to display
     */
    limit: {
      type: Number,
      default: 15
    }
  },
  
  emits: [
    'view-ready',
    'selection-change',
    'error',
    'smooth-layout-started',
    'smooth-layout-stopped'
  ],
  
  setup(props, { emit }) {
    // Access layout composable for smooth layout control
    const { startSmoothLayout, stopSmoothLayout } = useGraphLayouts();
    
    // Reference to base view component
    const baseView = ref(null);
    
    // Data loader parameters
    const dataLoaderParams = computed(() => ({
      minPools: props.minPools,
      limit: props.limit
    }));
    
    // Layout configuration for pool overview
    const layoutConfig = computed(() => ({
      algorithm: 'pools',  // Use semantic pool positioning
      preventOverlaps: true,
      // Pool overview specific settings
      poolRadius: 100,     // Radius for pool node positioning
      bridgeOffset: 200,   // Offset for bridge entities from center
      edgeStrength: 0.1    // Edge attraction strength
    }));
    
    // Selection configuration
    const selectionConfig = computed(() => ({
      enableBridgeSelection: true,   // Allow selecting bridge entities
      enablePoolSelection: true,     // Allow selecting pools
      clearOnStageClick: true,       // Clear selection on empty space click
      highlightConnections: true     // Highlight connected nodes on selection
    }));
    
    /**
     * Handle data loaded event
     * This is where we can add pool-specific data enhancements
     */
    const onDataLoaded = (data) => {
      console.log(`Pool Overview: Loaded ${data.nodes.length} nodes, ${data.edges.length} edges`);
      
      // Data is already enhanced by the service with:
      // - Pool nodes with semantic positions
      // - Bridge entities with power calculations
      // - Cross-pool edges
    };
    
    /**
     * Handle layout complete event
     * Start smooth layout if enabled
     */
    const onLayoutComplete = (algorithm) => {
      if (props.enableSmoothLayout && baseView.value) {
        const graph = baseView.value.graph;
        if (graph && graph.order > 0) {
          startSmoothLayout(graph);
          emit('smooth-layout-started');
        }
      }
    };
    
    /**
     * Start smooth animated layout
     * Called from parent component via ref
     */
    const startAnimatedLayout = () => {
      if (baseView.value && baseView.value.graph) {
        startSmoothLayout(baseView.value.graph);
        emit('smooth-layout-started');
      }
    };
    
    /**
     * Stop smooth animated layout
     * Called from parent component via ref
     */
    const stopAnimatedLayout = () => {
      stopSmoothLayout();
      emit('smooth-layout-stopped');
    };
    
    /**
     * Refresh the view
     * Delegated to base view
     */
    const refresh = async () => {
      if (baseView.value) {
        await baseView.value.initializeView();
      }
    };
    
    return {
      // Refs
      baseView,
      
      // Computed
      dataLoaderParams,
      layoutConfig,
      selectionConfig,
      
      // Methods
      onDataLoaded,
      onLayoutComplete,
      startAnimatedLayout,
      stopAnimatedLayout,
      refresh
    };
  }
};
</script>

<style scoped>
/* Pool Overview specific styles */
/* Most styling is handled by BaseGraphView */

/* Override loading message for this view */
:deep(.loading-text) {
  &::after {
    content: ' (Bridge Entities)';
    opacity: 0.7;
  }
}

/* Enhance pool node appearance in this view */
:deep(.view-type-pool-overview) {
  /* Pool nodes should be more prominent */
  .sigma-node-pool {
    stroke-width: 3px;
  }
  
  /* Bridge entities with animation */
  .sigma-node-bridge {
    transition: opacity 0.3s ease;
  }
}
</style>