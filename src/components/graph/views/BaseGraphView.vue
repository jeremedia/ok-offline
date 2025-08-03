<!--
BaseGraphView.vue - Abstract Base Component for Knowledge Graph Views

This is an abstract component that provides shared functionality for all knowledge graph views.
It handles common patterns like graph initialization, data loading, error handling, and lifecycle management.

IMPORTANT: This is an abstract component and should not be used directly.
Extend it by creating specific view components that implement the required props and methods.

Props (Required by extending components):
- viewType: String identifying the view type
- dataLoader: Function that returns Promise<graphData>
- layoutConfig: Object with layout algorithm and parameters
- selectionConfig: Object with selection behavior configuration

Emits:
- view-ready: When the view is fully loaded and rendered
- selection-change: When node/bridge selection changes
- error: When an error occurs during loading/rendering

Extending Components Should Implement:
- loadData(): Load view-specific data
- applyLayout(): Apply view-specific layout algorithm
- configureInteractions(): Setup view-specific interactions

Usage Pattern:
```vue
<template>
  <BaseGraphView
    view-type="pool-overview"
    :data-loader="loadBridgeData"
    :layout-config="{ algorithm: 'pools', preventOverlaps: true }"
    @view-ready="onViewReady"
  />
</template>
```
-->
<template>
  <div 
    ref="graphContainer" 
    class="base-graph-view"
    :class="[
      `view-type-${viewType}`,
      { 'loading': loading, 'error': hasError }
    ]"
  >
    <!-- Loading State -->
    <Transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p class="loading-text">{{ loadingMessage }}</p>
      </div>
    </Transition>
    
    <!-- Error State -->
    <Transition name="fade">
      <div v-if="hasError" class="error-overlay">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Failed to Load Graph</h3>
        <p class="error-message">{{ errorMessage }}</p>
        <button @click="retryLoad" class="retry-button">
          Retry
        </button>
      </div>
    </Transition>
    
    <!-- Graph content renders here via Sigma.js -->
    <!-- The graphContainer ref is passed to the renderer -->
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Graph from 'graphology';
import { useGraphRenderer } from '../composables/useGraphRenderer.js';
import { useGraphSelection } from '../composables/useGraphSelection.js';
import { useGraphInteractions } from '../composables/useGraphInteractions.js';
import { useGraphLayouts } from '../composables/useGraphLayouts.js';

export default {
  name: 'BaseGraphView',
  
  props: {
    /**
     * Identifier for the view type (pool-overview, single-pool, entity-neighborhood)
     */
    viewType: {
      type: String,
      required: true,
      validator: (value) => ['pool-overview', 'single-pool', 'entity-neighborhood'].includes(value)
    },
    
    /**
     * Function that loads data for this view
     * Should return Promise<{ nodes: Array, edges: Array }>
     */
    dataLoader: {
      type: Function,
      required: true
    },
    
    /**
     * Configuration for layout algorithm
     */
    layoutConfig: {
      type: Object,
      default: () => ({
        algorithm: 'force',
        preventOverlaps: true,
        iterations: 300
      })
    },
    
    /**
     * Configuration for selection behavior
     */
    selectionConfig: {
      type: Object,
      default: () => ({
        enableBridgeSelection: true,
        enablePoolSelection: true,
        clearOnStageClick: true
      })
    },
    
    /**
     * Optional parameters passed to the data loader
     */
    dataLoaderParams: {
      type: Object,
      default: () => ({})
    },
    
    /**
     * Whether to automatically load data on mount
     */
    autoLoad: {
      type: Boolean,
      default: true
    }
  },
  
  emits: [
    'view-ready',
    'selection-change', 
    'error',
    'data-loaded',
    'layout-complete'
  ],
  
  setup(props, { emit }) {
    // Component state
    const graphContainer = ref(null);
    const loading = ref(false);
    const hasError = ref(false);
    const errorMessage = ref('');
    const loadingMessage = ref('Loading graph data...');
    const graph = ref(new Graph());
    
    // Composables
    const {
      loading: rendererLoading,
      ensureRenderer,
      updateRenderer,
      resetView,
      zoomToFit,
      getRenderer,
      cleanup: cleanupRenderer
    } = useGraphRenderer();
    
    const {
      selectedBridge,
      selectedNode,
      selectBridgeEntity,
      selectPoolEntity,
      selectNode,
      clearAllSelections
    } = useGraphSelection();
    
    const {
      setupDraggableNodes,
      setupClickHandlers
    } = useGraphInteractions();
    
    const {
      runForceLayout,
      runPoolOverviewLayout,
      startSmoothLayout,
      stopSmoothLayout,
      preventNodeOverlaps,
      cleanup: cleanupLayouts
    } = useGraphLayouts();
    
    /**
     * Load data using the provided data loader function
     */
    const loadData = async () => {
      loading.value = true;
      hasError.value = false;
      loadingMessage.value = 'Loading graph data...';
      
      try {
        const data = await props.dataLoader(props.dataLoaderParams);
        
        if (!data || !data.nodes) {
          throw new Error('Invalid data format: missing nodes array');
        }
        
        // Clear existing graph
        graph.value.clear();
        
        // Add nodes to graph
        data.nodes.forEach(node => {
          if (graph.value.hasNode(node.id)) {
            console.warn(`Duplicate node ID: ${node.id}`);
            return;
          }
          graph.value.addNode(node.id, { ...node });
        });
        
        // Add edges to graph if provided
        if (data.edges && Array.isArray(data.edges)) {
          data.edges.forEach(edge => {
            if (!graph.value.hasNode(edge.source) || !graph.value.hasNode(edge.target)) {
              console.warn(`Edge references missing node: ${edge.source} -> ${edge.target}`);
              return;
            }
            if (graph.value.hasEdge(edge.source, edge.target)) {
              console.warn(`Duplicate edge: ${edge.source} -> ${edge.target}`);
              return;
            }
            graph.value.addEdge(edge.source, edge.target, { ...edge });
          });
        }
        
        emit('data-loaded', { nodes: data.nodes, edges: data.edges || [] });
        return data;
        
      } catch (error) {
        console.error(`Failed to load data for ${props.viewType}:`, error);
        hasError.value = true;
        errorMessage.value = error.message || 'Unknown error occurred';
        emit('error', error);
        throw error;
      } finally {
        loading.value = false;
      }
    };
    
    /**
     * Apply layout algorithm based on configuration
     */
    const applyLayout = async () => {
      if (!graph.value || graph.value.order === 0) return;
      
      loadingMessage.value = 'Applying layout...';
      
      try {
        const { algorithm, ...config } = props.layoutConfig;
        
        switch (algorithm) {
          case 'pools':
            runPoolOverviewLayout(graph.value);
            break;
          case 'force':
            runForceLayout(graph.value, config.iterations || 300);
            break;
          case 'smooth':
            startSmoothLayout(graph.value);
            break;
          default:
            console.warn(`Unknown layout algorithm: ${algorithm}`);
            runForceLayout(graph.value, 300);
        }
        
        // Prevent overlaps if requested
        if (config.preventOverlaps) {
          preventNodeOverlaps(graph.value);
        }
        
        emit('layout-complete', algorithm);
        
      } catch (error) {
        console.error('Layout application failed:', error);
        emit('error', error);
      }
    };
    
    /**
     * Setup interactions based on configuration
     */
    const setupInteractions = () => {
      const renderer = getRenderer();
      if (!renderer) return;
      
      // Setup drag interactions
      setupDraggableNodes(graph.value, renderer);
      
      // Setup click handlers with selection logic
      setupClickHandlers(graph.value, renderer, {
        onNodeClick: (nodeId, nodeData) => {
          const config = props.selectionConfig;
          
          // Handle different selection types based on configuration
          if (nodeData.nodeType === 'bridge' && config.enableBridgeSelection) {
            selectBridgeEntity(graph.value, renderer, nodeId, nodeData);
          } else if (nodeData.nodeType === 'pool' && config.enablePoolSelection) {
            selectPoolEntity(graph.value, renderer, nodeId, nodeData);
          } else {
            selectNode(nodeId, nodeData);
          }
          
          emit('selection-change', { type: 'node', nodeId, nodeData });
        },
        
        onStageClick: () => {
          if (props.selectionConfig.clearOnStageClick) {
            clearAllSelections(graph.value, getRenderer());
            emit('selection-change', { type: 'clear' });
          }
        }
      });
    };
    
    /**
     * Initialize the complete view
     */
    const initializeView = async () => {
      try {
        // Load data first
        await loadData();
        
        // Ensure renderer is ready
        await ensureRenderer(graph.value, graphContainer);
        
        // Apply layout
        await applyLayout();
        
        // Setup interactions
        setupInteractions();
        
        // Update renderer to show everything
        await updateRenderer();
        
        // Auto-fit to view
        await nextTick();
        zoomToFit(graph.value);
        
        emit('view-ready', props.viewType);
        
      } catch (error) {
        console.error('View initialization failed:', error);
        hasError.value = true;
        errorMessage.value = 'Failed to initialize graph view';
      }
    };
    
    /**
     * Retry loading after an error
     */
    const retryLoad = () => {
      hasError.value = false;
      errorMessage.value = '';
      initializeView();
    };
    
    /**
     * Clean up resources
     */
    const cleanup = () => {
      stopSmoothLayout();
      cleanupLayouts();
      cleanupRenderer();
      if (graph.value) {
        graph.value.clear();
      }
    };
    
    // Watch for data loader changes
    watch(() => [props.dataLoader, props.dataLoaderParams], () => {
      if (props.autoLoad) {
        initializeView();
      }
    }, { deep: true });
    
    // Lifecycle
    onMounted(() => {
      if (props.autoLoad) {
        initializeView();
      }
    });
    
    onUnmounted(() => {
      cleanup();
    });
    
    // Public API for extending components
    return {
      // State
      graphContainer,
      loading: loading,
      hasError,
      errorMessage,
      loadingMessage,
      graph,
      
      // Selection state from composable
      selectedBridge,
      selectedNode,
      
      // Methods
      loadData,
      applyLayout,
      setupInteractions,
      initializeView,
      retryLoad,
      cleanup,
      
      // Renderer controls
      resetView,
      zoomToFit,
      getRenderer,
      
      // Layout controls
      startSmoothLayout,
      stopSmoothLayout
    };
  }
};
</script>

<style scoped>
.base-graph-view {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
  overflow: hidden;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--bg-primary-rgb), 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

/* Error overlay */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--bg-primary-rgb), 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  color: var(--text-primary);
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
}

.error-message {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 2rem 0;
  max-width: 400px;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-accent);
  color: var(--text-primary);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.retry-button:hover {
  opacity: 0.8;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* View-specific styles can be added here */
.view-type-pool-overview {
  /* Pool overview specific styles */
}

.view-type-single-pool {
  /* Single pool specific styles */
}

.view-type-entity-neighborhood {
  /* Entity neighborhood specific styles */
}
</style>