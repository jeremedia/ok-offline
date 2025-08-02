// Knowledge Graph Service for Seven Pools visualization

// API configuration
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3555' 
  : 'https://offline.oknotok.com';

const GRAPH_CACHE_KEY = 'ok_graph_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

class KnowledgeGraphService {
  constructor() {
    this.cache = new Map();
    this.loadCache();
  }

  // Cache management
  loadCache() {
    try {
      const stored = localStorage.getItem(GRAPH_CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.expires > Date.now()) {
          this.cache = new Map(data.entries);
        }
      }
    } catch (e) {
      console.error('Failed to load graph cache:', e);
    }
  }

  saveCache() {
    try {
      const data = {
        expires: Date.now() + CACHE_DURATION,
        entries: Array.from(this.cache.entries())
      };
      localStorage.setItem(GRAPH_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save graph cache:', e);
    }
  }

  getCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
  }

  // API methods
  async getGraphStats() {
    const cacheKey = this.getCacheKey('stats', {});
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/graph/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      this.saveCache();
      return data;
    } catch (error) {
      console.error('Failed to fetch graph stats:', error);
      throw error;
    }
  }

  async getPoolClusters(pools = null) {
    const params = pools ? { pools } : {};
    const cacheKey = this.getCacheKey('clusters', params);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = pools 
        ? `${API_BASE_URL}/api/v1/graph/clusters?pools=${pools.join(',')}`
        : `${API_BASE_URL}/api/v1/graph/clusters`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.cache.set(cacheKey, data);
      this.saveCache();
      return data;
    } catch (error) {
      console.error('Failed to fetch pool clusters:', error);
      throw error;
    }
  }

  async getPoolGraph(poolName, limit = 1000, offset = 0) {
    const cacheKey = this.getCacheKey('pool', { poolName, limit, offset });
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/graph/export/pool/${poolName}?limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      // Only cache if it's a complete page
      if (!data.has_more || limit <= 100) {
        this.cache.set(cacheKey, data);
        this.saveCache();
      }
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch pool graph for ${poolName}:`, error);
      throw error;
    }
  }

  async getEntityNeighborhood(entityId, depth = 2) {
    const cacheKey = this.getCacheKey('neighborhood', { entityId, depth });
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/graph/export/neighborhood/${encodeURIComponent(entityId)}?depth=${depth}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      this.cache.set(cacheKey, data);
      this.saveCache();
      return data;
    } catch (error) {
      console.error(`Failed to fetch neighborhood for ${entityId}:`, error);
      throw error;
    }
  }

  async searchEntity(name, pool = null) {
    try {
      const url = pool 
        ? `${API_BASE_URL}/api/v1/graph/entity/${encodeURIComponent(name)}?pool=${pool}`
        : `${API_BASE_URL}/api/v1/graph/entity/${encodeURIComponent(name)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to search entity ${name}:`, error);
      throw error;
    }
  }

  async findBridges(pool1, pool2) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/graph/bridge?pool1=${pool1}&pool2=${pool2}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to find bridges between ${pool1} and ${pool2}:`, error);
      throw error;
    }
  }

  async getBridgeEntities(minPools = 2, limit = 20) {
    const cacheKey = this.getCacheKey('bridge_entities', { minPools, limit });
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/graph/bridge_entities?min_pools=${minPools}&limit=${limit}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      this.cache.set(cacheKey, data);
      this.saveCache();
      return data;
    } catch (error) {
      console.error('Failed to fetch bridge entities:', error);
      throw error;
    }
  }

  // Progressive loading for large graphs
  async *loadPoolGraphProgressive(poolName, pageSize = 500) {
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const data = await this.getPoolGraph(poolName, pageSize, offset);
      yield data;
      
      hasMore = data.has_more;
      offset += pageSize;
      
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Pool color mapping - uses CSS variables for theme consistency
  getPoolColor(poolName) {
    // Get CSS variable values from the current theme
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    
    const colors = {
      manifest: getVar('--color-error') || '#FF6B6B',        // Red - Physical manifestation
      experience: getVar('--color-info') || '#4ECDC4',       // Info blue/teal - Direct experience  
      relational: getVar('--color-primary') || '#45B7D1',    // Primary - Connections
      practical: getVar('--color-success') || '#96CEB4',     // Green - Practical knowledge
      idea: getVar('--color-warning') || '#FECA57',          // Warning yellow - Concepts
      evolutionary: getVar('--color-accent') || '#DDA0DD',   // Accent - Growth/change
      emanation: getVar('--color-primary-dark') || '#FF8B94' // Primary dark - Emergence
    };
    
    return colors[poolName] || getVar('--color-text-muted') || '#666666';
  }

  // Graph utilities
  calculateGraphBounds(nodes) {
    if (!nodes || nodes.length === 0) return null;
    
    const xs = nodes.map(n => n.x || 0);
    const ys = nodes.map(n => n.y || 0);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    localStorage.removeItem(GRAPH_CACHE_KEY);
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();