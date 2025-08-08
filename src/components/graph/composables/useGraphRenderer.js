// useGraphRenderer.js - Composable for managing Sigma.js renderer
// This composable handles the initialization and management of the Sigma.js renderer instance
// Extracted from KnowledgeGraph.vue to be reusable across different graph views

import { ref, nextTick } from 'vue';
import Sigma from 'sigma';
import { NodeBorderProgram } from '@sigma/node-border';
import { fitViewportToNodes } from '@sigma/utils';

export function useGraphRenderer() {
  // Renderer and camera instances - not reactive to avoid Vue overhead
  let renderer = null;
  let camera = null;
  
  // Loading state for UI feedback
  const loading = ref(false);
  
  // Utility function for theme CSS variables
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  /**
   * Initialize/reset the graph instance
   * Cleans up any existing renderer before creating new one
   * @param {Graph} graph - Graphology graph instance
   */
  const initializeGraph = (graph) => {
    // Clean up existing renderer
    if (renderer) {
      renderer.kill();
      renderer = null;
      camera = null;
    }
    
    // Clear the graph
    if (graph) {
      graph.clear();
    }
  };
  
  /**
   * Ensure renderer exists - creates Sigma.js renderer only once
   * This prevents recreating the renderer on every view change (which caused flashing)
   * @param {Graph} graph - Graphology graph instance
   * @param {Ref} containerRef - Vue ref to the container DOM element
   * @returns {Promise<boolean>} - Success status
   */
  const ensureRenderer = async (graph, containerRef) => {
    if (renderer) return true;  // Already exists, no need to recreate
    
    // Wait for DOM updates to complete before creating renderer
    await nextTick();
    
    if (!containerRef.value) {
      console.error('Graph container not available');
      return false;
    }
    
    try {
      // Create Sigma.js renderer with optimized settings for mobile performance
      // Use CSS variables for theme-aware default colors and include border support
      renderer = new Sigma(graph, containerRef.value, {
        renderLabels: true,
        renderEdgeLabels: false,
        minCameraRatio: 0.1,
        maxCameraRatio: 10,
        defaultNodeColor: getVar('--color-text-muted') || '#666',
        defaultEdgeColor: getVar('--color-border-medium') || '#ccc',
        defaultLabelColor: getVar('--color-text-primary') || '#fff',
        labelDensity: 0.5,
        labelGridCellSize: 100,
        labelRenderedSizeThreshold: 8,
        nodeProgramClasses: {
          border: NodeBorderProgram, // Enable node border rendering
        },
        // Performance optimizations for mobile
        zoomToSizeRatioFunction: (ratio) => Math.pow(ratio, 0.5),
        itemSizesReference: 'positions',
        stagePadding: 30,
        // Touch-friendly settings
        allowInvalidContainer: true,
        enableEdgeEvents: false,  // Better performance on mobile
      });
      
      camera = renderer.getCamera();
      return true;
    } catch (error) {
      console.error('Failed to create renderer:', error);
      return false;
    }
  };
  
  /**
   * Update renderer after graph changes
   * Refreshes the display and optionally resets camera
   * @param {boolean} resetCamera - Whether to reset camera position
   */
  const updateRenderer = async (resetCamera = true) => {
    if (renderer) {
      try {
        renderer.refresh();
        if (camera && resetCamera) {
          camera.animatedReset();
        }
        // Mark loading as complete
        loading.value = false;
      } catch (error) {
        console.error('Error updating renderer:', error);
        loading.value = false;
      }
    }
  };
  
  /**
   * Reset camera view to default position
   */
  const resetView = () => {
    if (camera) {
      camera.animatedReset();
    }
  };
  
  /**
   * Zoom to fit all nodes in viewport using @sigma/utils
   * @param {Graph} graph - Graphology graph instance
   */
  const zoomToFit = (graph) => {
    if (!renderer || !graph) return;
    
    try {
      // Use Sigma utils to fit all nodes in viewport with padding
      fitViewportToNodes(renderer, graph.nodes(), {
        animate: true,
        duration: 500,
        padding: 0.1
      });
    } catch (error) {
      console.error('Error in zoomToFit:', error);
      // Fallback to camera reset
      if (camera) {
        camera.animatedReset();
      }
    }
  };
  
  /**
   * Get the current renderer instance
   * @returns {Sigma|null} The Sigma renderer instance
   */
  const getRenderer = () => renderer;
  
  /**
   * Get the current camera instance
   * @returns {Camera|null} The Sigma camera instance
   */
  const getCamera = () => camera;
  
  /**
   * Clean up renderer and camera instances
   * Should be called on component unmount
   */
  const cleanup = () => {
    if (renderer) {
      renderer.kill();
      renderer = null;
      camera = null;
    }
  };
  
  return {
    // State
    loading,
    
    // Core functions
    initializeGraph,
    ensureRenderer,
    updateRenderer,
    
    // Camera controls
    resetView,
    zoomToFit,
    
    // Instance getters
    getRenderer,
    getCamera,
    
    // Cleanup
    cleanup
  };
}