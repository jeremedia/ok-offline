// useGraphSelection.js - Composable for managing graph selection state
// This composable centralizes all selection-related logic and state management
// Used by view components to maintain consistent selection behavior across different graph types

import { ref } from 'vue';

export function useGraphSelection() {
  // Selection state - centralized across all views
  const selectedBridge = ref(null);
  const selectedNode = ref(null);
  
  /**
   * Get theme CSS variable value
   * @param {string} name - CSS variable name
   * @returns {string} CSS variable value
   */
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  /**
   * Select a bridge entity and highlight its connections
   * Used in Pool Overview mode to show bridge-pool relationships
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {string} bridgeId - ID of the bridge entity to select
   * @param {Object} bridgeNode - Node attributes of the bridge
   */
  const selectBridgeEntity = (graph, renderer, bridgeId, bridgeNode) => {
    // Clear any previous selection
    clearBridgeSelection(graph, renderer);
    
    // Store selected bridge
    selectedBridge.value = { id: bridgeId, ...bridgeNode };
    
    // Highlight the selected bridge entity
    graph.setNodeAttribute(bridgeId, 'size', (bridgeNode.size || 20) * 1.3);
    graph.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
    
    // Get connected pools for this bridge
    const connectedPools = bridgeNode.pools || [];
    
    // Highlight connected pool nodes
    connectedPools.forEach(pool => {
      const poolNodeId = `pool_${pool}`;
      if (graph.hasNode(poolNodeId)) {
        // Make pool nodes larger and more prominent
        const currentSize = graph.getNodeAttribute(poolNodeId, 'size') || 15;
        graph.setNodeAttribute(poolNodeId, 'size', currentSize * 1.8);
        
        // Add glowing border effect to show connection
        graph.setNodeAttribute(poolNodeId, 'borderColor', getVar('--color-accent') || '#FFD700');
        graph.setNodeAttribute(poolNodeId, 'borderWidth', 3);
      }
    });
    
    // Highlight edges connecting bridge to pools
    graph.edges().forEach(edgeId => {
      const [source, target] = graph.extremities(edgeId);
      if (source === bridgeId || target === bridgeId) {
        // Check if the other end is a connected pool
        const otherNode = source === bridgeId ? target : source;
        const poolName = otherNode.replace('pool_', '');
        if (connectedPools.includes(poolName)) {
          graph.setEdgeAttribute(edgeId, 'color', getVar('--color-accent') || '#FFD700');
          graph.setEdgeAttribute(edgeId, 'size', 3);
        }
      }
    });
    
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Select a pool entity and highlight its connected bridges
   * Used in Pool Overview mode to show pool-bridge relationships
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   * @param {string} poolId - ID of the pool to select
   * @param {Object} poolNode - Node attributes of the pool
   */
  const selectPoolEntity = (graph, renderer, poolId, poolNode) => {
    // Clear any previous selection
    clearBridgeSelection(graph, renderer);
    
    // Store selected pool as selectedNode (pools don't have separate state)
    selectedNode.value = { id: poolId, ...poolNode };
    
    // Highlight the selected pool
    const poolName = poolId.replace('pool_', '');
    graph.setNodeAttribute(poolId, 'borderColor', getVar('--color-accent') || '#FFD700');
    graph.setNodeAttribute(poolId, 'borderWidth', 4);
    
    // Find and highlight all bridges connected to this pool
    const connectedBridges = [];
    graph.forEachNode((bridgeId, bridgeNode) => {
      if (bridgeNode.nodeType === 'bridge' && bridgeNode.pools?.includes(poolName)) {
        connectedBridges.push(bridgeId);
        
        // Highlight the bridge
        graph.setNodeAttribute(bridgeId, 'size', (bridgeNode.size || 20) * 1.2);
        graph.setNodeAttribute(bridgeId, 'borderColor', getVar('--color-accent') || '#FFD700');
        graph.setNodeAttribute(bridgeId, 'borderWidth', 2);
      }
    });
    
    // Highlight edges between pool and connected bridges
    graph.edges().forEach(edgeId => {
      const [source, target] = graph.extremities(edgeId);
      if ((source === poolId && connectedBridges.includes(target)) ||
          (target === poolId && connectedBridges.includes(source))) {
        graph.setEdgeAttribute(edgeId, 'color', getVar('--color-accent') || '#FFD700');
        graph.setEdgeAttribute(edgeId, 'size', 3);
      }
    });
    
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Clear all bridge and pool selections, restore default styles
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   */
  const clearBridgeSelection = (graph, renderer) => {
    if (!graph) return;
    
    // Clear selection state
    selectedBridge.value = null;
    // Note: selectedNode is managed separately for non-bridge selections
    
    // Reset all bridge nodes to default appearance
    graph.forEachNode((nodeId, attributes) => {
      if (attributes.nodeType === 'bridge') {
        // Reset bridge nodes
        graph.setNodeAttribute(nodeId, 'size', attributes.originalSize || attributes.size || 20);
        graph.removeNodeAttribute(nodeId, 'borderColor');
        graph.removeNodeAttribute(nodeId, 'borderWidth');
      } else if (attributes.nodeType === 'pool') {
        // Reset pool nodes
        graph.setNodeAttribute(nodeId, 'size', attributes.originalSize || attributes.size || 15);
        graph.removeNodeAttribute(nodeId, 'borderColor');
        graph.removeNodeAttribute(nodeId, 'borderWidth');
      }
    });
    
    // Reset all edges to default appearance
    graph.forEachEdge((edgeId, attributes) => {
      graph.setEdgeAttribute(edgeId, 'color', attributes.originalColor || getVar('--color-border-medium') || '#ccc');
      graph.setEdgeAttribute(edgeId, 'size', attributes.originalSize || 1);
    });
    
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Select any node (bridge, pool, or entity) and store its information
   * Used across all view types for displaying node details in info panel
   * @param {string} nodeId - ID of the node to select
   * @param {Object} nodeData - Node attributes
   */
  const selectNode = (nodeId, nodeData) => {
    selectedNode.value = { id: nodeId, ...nodeData };
  };
  
  /**
   * Clear all selections (both bridge and node)
   */
  const clearAllSelections = (graph, renderer) => {
    selectedNode.value = null;
    clearBridgeSelection(graph, renderer);
  };
  
  /**
   * Search for an entity by setting it as the search term
   * Triggers entity neighborhood view with the selected node's label
   * @param {Function} setEntitySearch - Function to update entity search term
   * @param {Function} setViewMode - Function to change view mode
   * @param {Function} loadEntityNeighborhood - Function to load entity data
   */
  const searchForEntity = (setEntitySearch, setViewMode, loadEntityNeighborhood) => {
    if (selectedNode.value) {
      setEntitySearch(selectedNode.value.label);
      setViewMode('entity');
      loadEntityNeighborhood();
      selectedNode.value = null; // Clear selection after search
    }
  };
  
  /**
   * Check if a node is currently selected
   * @param {string} nodeId - ID of the node to check
   * @returns {boolean} True if node is selected
   */
  const isNodeSelected = (nodeId) => {
    return selectedNode.value?.id === nodeId || selectedBridge.value?.id === nodeId;
  };
  
  /**
   * Get the currently selected item (node or bridge)
   * @returns {Object|null} Selected item or null
   */
  const getSelectedItem = () => {
    return selectedNode.value || selectedBridge.value;
  };
  
  return {
    // State
    selectedBridge,
    selectedNode,
    
    // Selection functions
    selectBridgeEntity,
    selectPoolEntity,
    selectNode,
    clearBridgeSelection,
    clearAllSelections,
    searchForEntity,
    
    // Utility functions
    isNodeSelected,
    getSelectedItem
  };
}