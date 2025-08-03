// useGraphLayouts.js - Composable for managing graph layout algorithms
// This composable handles all layout calculations and positioning logic
// Extracted from KnowledgeGraph.vue to be reusable across different graph views

import { ref } from 'vue';
import circular from 'graphology-layout/circular.js';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import ForceSupervisor from 'graphology-layout-force/worker';
import { knowledgeGraphService } from '../../../services/knowledgeGraphService.js';

export function useGraphLayouts() {
  // Layout supervisor for smooth animated layouts
  let forceSupervisor = null;
  
  /**
   * Get theme CSS variable value
   * @param {string} name - CSS variable name
   * @returns {string} CSS variable value
   */
  const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  
  /**
   * Run force-directed layout using ForceAtlas2 algorithm
   * This creates the organic, cluster-like positioning of nodes
   * @param {Object} graph - Graphology graph instance
   * @param {Object} camera - Sigma camera instance
   */
  const runForceLayout = (graph, camera) => {
    const settings = {
      iterations: 50,           // Number of layout iterations
      settings: {
        gravity: 1,             // Pull nodes toward center
        scalingRatio: 10,       // Spacing between nodes
        slowDown: 1,            // Layout convergence speed
        outboundAttractionDistribution: false  // Classic ForceAtlas2
      }
    };
    
    // Apply the layout algorithm to position all nodes
    forceAtlas2.assign(graph, settings);
    
    // Center the camera view on the newly laid out graph
    if (camera) {
      camera.animatedReset();
    }
  };
  
  /**
   * Specialized layout for pool overview - more compact and viewport-fitted
   * Optimized for showing the Seven Pools and their relationships
   * @param {Object} graph - Graphology graph instance
   * @param {Function} zoomToFit - Function to zoom camera to fit all nodes
   */
  const runPoolOverviewLayout = (graph, zoomToFit) => {
    const settings = {
      iterations: 30,           // Fewer iterations for faster processing
      settings: {
        gravity: 2,             // Stronger pull toward center
        scalingRatio: 6,        // Tighter spacing between pools
        slowDown: 2,            // Faster convergence
        outboundAttractionDistribution: false
      }
    };
    
    // Apply the layout algorithm
    forceAtlas2.assign(graph, settings);
    
    // Auto-fit to viewport after layout
    setTimeout(() => {
      if (zoomToFit) zoomToFit(graph);
    }, 100);
  };
  
  /**
   * Calculate semantic positions for Seven Pools based on their relationships
   * Arranges pools from concrete (bottom) to abstract (top)
   * @param {Array} pools - Array of pool names
   * @returns {Array} Array of {x, y} positions for each pool
   */
  const calculatePoolPositions = (pools) => {
    const positions = [];
    const radius = 200; // Distance from center
    
    // Create meaningful arrangement based on semantic relationships
    // This positions pools in a way that reflects their conceptual relationships
    const semanticPositions = {
      'manifest': { x: 0, y: radius },              // Bottom center - physical manifestation
      'experience': { x: radius * 0.8, y: radius * 0.6 },   // Bottom-right - direct experience
      'practical': { x: radius, y: 0 },            // Right - practical application
      'relational': { x: radius * 0.6, y: -radius * 0.8 },  // Top-right - relationships
      'idea': { x: 0, y: -radius },                // Top center - abstract concepts
      'evolutionary': { x: -radius * 0.6, y: -radius * 0.8 }, // Top-left - evolution/growth
      'emanation': { x: -radius, y: 0 }            // Left - transcendent emergence
    };
    
    // Map each pool to its semantic position
    pools.forEach(pool => {
      if (semanticPositions[pool]) {
        positions.push(semanticPositions[pool]);
      } else {
        // Fallback to circle position for any unknown pools
        const i = pools.indexOf(pool);
        const angle = (i * 2 * Math.PI) / pools.length;
        positions.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }
    });
    
    return positions;
  };
  
  /**
   * Calculate bridge entity position based on semantic relationships
   * Bridge entities are positioned based on their "power" and pool connections
   * @param {Array} bridgePools - Pools this bridge connects
   * @param {Array} poolPositions - Positions of all pools
   * @param {Array} allPools - List of all pool names
   * @param {number} bridgePower - Power level of this bridge (based on connections)
   * @returns {Object} {x, y} position for the bridge
   */
  const calculateBridgePosition = (bridgePools, poolPositions, allPools, bridgePower) => {
    // For high-power bridges spanning many pools (5+), place them centrally
    // These represent the most "enliterate" concepts
    if (bridgePools.length >= 5) {
      // Central powerful bridges get positions in the core
      const angle = Math.random() * Math.PI * 2;
      const radius = 80 + (Math.random() * 40); // Core zone
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    }
    
    // For medium bridges spanning 3-4 pools, create bridge zones
    // These show moderate cross-pool connections
    if (bridgePools.length >= 3) {
      let totalX = 0, totalY = 0, validPositions = 0;
      
      bridgePools.forEach(pool => {
        const poolIndex = allPools.indexOf(pool);
        if (poolIndex !== -1 && poolPositions[poolIndex]) {
          totalX += poolPositions[poolIndex].x;
          totalY += poolPositions[poolIndex].y;
          validPositions++;
        }
      });
      
      if (validPositions > 0) {
        // Position in the middle of connected pools, but pulled toward center
        const avgX = totalX / validPositions;
        const avgY = totalY / validPositions;
        const pullFactor = 0.4; // Pull toward center to show bridging nature
        
        return {
          x: avgX * (1 - pullFactor),
          y: avgY * (1 - pullFactor)
        };
      }
    }
    
    // For 2-pool bridges, position along the edge between pools
    // These show direct connections between two domains
    if (bridgePools.length === 2) {
      const pool1Index = allPools.indexOf(bridgePools[0]);
      const pool2Index = allPools.indexOf(bridgePools[1]);
      
      if (pool1Index !== -1 && pool2Index !== -1 && 
          poolPositions[pool1Index] && poolPositions[pool2Index]) {
        const pos1 = poolPositions[pool1Index];
        const pos2 = poolPositions[pool2Index];
        
        // Position along the line between pools with some variation
        const t = 0.4 + (Math.random() * 0.2); // Between 40-60% along the line
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetRadius = 15 + (Math.random() * 15);
        
        return {
          x: pos1.x + (pos2.x - pos1.x) * t + Math.cos(offsetAngle) * offsetRadius,
          y: pos1.y + (pos2.y - pos1.y) * t + Math.sin(offsetAngle) * offsetRadius
        };
      }
    }
    
    // Fallback to center with small radius
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + (Math.random() * 30);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };
  
  /**
   * Calculate bridge color based on pool combination
   * Uses theme-aware colors and special colors for powerful bridges
   * @param {Array} bridgePools - Pools this bridge connects
   * @returns {string} Hex color for the bridge
   */
  const calculateBridgeColor = (bridgePools) => {
    if (bridgePools.length === 1) {
      return knowledgeGraphService.getPoolColor(bridgePools[0]);
    }
    
    // For multi-pool bridges, create a mixed color
    // Use primary pool color but with accent mixing
    const primaryPool = bridgePools[0];
    const baseColor = knowledgeGraphService.getPoolColor(primaryPool);
    
    // For powerful multi-pool bridges (4+), use a special enhanced color
    if (bridgePools.length >= 4) {
      return getVar('--color-accent') || '#FFD700'; // Gold for powerful bridges
    } else if (bridgePools.length >= 3) {
      return getVar('--color-primary') || baseColor; // Primary theme color
    }
    
    return baseColor;
  };
  
  /**
   * Start smooth animated layout using ForceSupervisor
   * Provides real-time layout adjustments with fixed pool positions
   * @param {Object} graph - Graphology graph instance
   * @returns {Object} The ForceSupervisor instance
   */
  const startSmoothLayout = (graph) => {
    // Stop any existing layout
    if (forceSupervisor) {
      forceSupervisor.kill();
      forceSupervisor = null;
    }
    
    // Create ForceSupervisor with settings optimized for bridge entities
    // Pools remain fixed while bridges find optimal positions
    forceSupervisor = new ForceSupervisor(graph, {
      attraction: 0.0005,      // Light attraction between connected nodes
      repulsion: 0.15,         // Stronger repulsion to prevent overlaps
      gravity: 0.01,           // Very light gravity toward center
      inertia: 0.8,           // Smooth movement
      maxIterations: 1000,     // Allow longer to converge
      isNodeFixed: (nodeKey, attributes) => {
        // Keep pool nodes fixed in their semantic positions
        return attributes.nodeType === 'pool';
      }
    });
    
    // Start the animated layout
    forceSupervisor.start();
    
    return forceSupervisor;
  };
  
  /**
   * Stop smooth layout animation
   * Cleans up the ForceSupervisor worker
   */
  const stopSmoothLayout = () => {
    if (forceSupervisor && forceSupervisor.isRunning()) {
      forceSupervisor.stop();
    }
  };
  
  /**
   * Legacy bridge layout for fallback
   * Uses minimal force to adjust positions while preserving semantic structure
   * @param {Object} graph - Graphology graph instance
   */
  const runBridgeLayout = (graph) => {
    // Apply minimal force layout to adjust only for overlap, preserve semantic positioning
    const settings = {
      iterations: 15, // Fewer iterations to preserve our semantic positioning
      settings: {
        gravity: 0.1,           // Very low gravity - trust our semantic positioning
        scalingRatio: 25,       // More spacing for readability  
        slowDown: 3,            // Fast convergence
        outboundAttractionDistribution: true, // Better edge handling
        linLogMode: false,      // Linear mode for smaller graphs
        adjustSizes: true,      // Account for node sizes
        edgeWeightInfluence: 0.3, // Moderate edge weight influence
        strongGravityMode: false
      }
    };
    
    // Only apply light forces to reduce overlap while preserving semantic structure
    forceAtlas2.assign(graph, settings);
  };
  
  /**
   * Prevent node overlaps using collision detection and adjustment
   * Iteratively adjusts node positions to ensure no visual overlap
   * @param {Object} graph - Graphology graph instance
   * @param {Object} renderer - Sigma renderer instance
   */
  const preventNodeOverlaps = (graph, renderer) => {
    if (!graph) return;
    
    const nodes = [];
    graph.forEachNode((nodeId, attributes) => {
      nodes.push({
        id: nodeId,
        x: attributes.x || 0,
        y: attributes.y || 0,
        size: attributes.size || 10,
        fixed: attributes.nodeType === 'pool' // Keep pools in their semantic positions
      });
    });
    
    // Simple collision detection and resolution
    const iterations = 10;
    const minDistance = 5; // Minimum distance between node edges
    
    for (let iter = 0; iter < iterations; iter++) {
      let adjusted = false;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          // Skip if both nodes are fixed (pools)
          if (nodeA.fixed && nodeB.fixed) continue;
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minRequiredDistance = (nodeA.size + nodeB.size) / 2 + minDistance;
          
          if (distance < minRequiredDistance && distance > 0) {
            const overlap = minRequiredDistance - distance;
            const moveDistance = overlap / 2;
            
            // Normalize direction vector
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;
            
            // Move nodes apart (only move non-fixed nodes)
            if (!nodeA.fixed) {
              nodeA.x -= moveX;
              nodeA.y -= moveY;
              adjusted = true;
            }
            if (!nodeB.fixed) {
              nodeB.x += moveX;
              nodeB.y += moveY;
              adjusted = true;
            }
          }
        }
      }
      
      // If no adjustments were made, we're done
      if (!adjusted) break;
    }
    
    // Apply the adjusted positions back to the graph
    nodes.forEach(node => {
      if (!node.fixed) { // Only update non-fixed nodes
        graph.setNodeAttribute(node.id, 'x', node.x);
        graph.setNodeAttribute(node.id, 'y', node.y);
      }
    });
    
    // Refresh renderer
    if (renderer) {
      renderer.refresh();
    }
  };
  
  /**
   * Clean up any running layouts
   * Should be called on component unmount
   */
  const cleanup = () => {
    if (forceSupervisor) {
      forceSupervisor.kill();
      forceSupervisor = null;
    }
  };
  
  return {
    // Layout algorithms
    runForceLayout,
    runPoolOverviewLayout,
    runBridgeLayout,
    
    // Position calculations
    calculatePoolPositions,
    calculateBridgePosition,
    calculateBridgeColor,
    
    // Smooth animation
    startSmoothLayout,
    stopSmoothLayout,
    
    // Overlap prevention
    preventNodeOverlaps,
    
    // Cleanup
    cleanup
  };
}