<template>
  <div class="search-result-item" @click="$emit('navigate', result)">
    <div class="result-header">
      <span class="result-type">{{ typeIcons[result.type] }}</span>
      <h3 class="result-title">{{ getItemName(result) }}</h3>
      <div class="result-actions">
        <div v-if="showSimilarityScore && result.similarity_score" class="similarity-score">
          <span class="score-label">Match:</span>
          <span class="score-value">{{ formatSimilarityScore(result.similarity_score) }}%</span>
        </div>
        <button 
          @click.stop="$emit('toggleFavorite', result)"
          class="favorite-btn"
          :class="{ active: result.isFavorited }"
          :title="result.isFavorited ? 'Remove from favorites' : 'Add to favorites'"
        >
          {{ result.isFavorited ? '★' : '☆' }}
        </button>
      </div>
    </div>
    
    <div class="result-content">
      <div class="result-location">
        📍 {{ displayLocation }}
      </div>
      
      <div v-if="result.description" class="result-description">
        {{ truncateDescription(result.description) }}
      </div>
      
      <!-- Enhanced metadata for vector search results -->
      <div v-if="result.entities && result.entities.length > 0" class="result-entities">
        <div class="entity-tags">
          <span 
            v-for="[type, value] in result.entities.slice(0, 3)"
            :key="`${type}-${value}`"
            class="entity-tag"
            :class="`entity-${type}`"
          >
            {{ value }}
          </span>
          <span v-if="result.entities.length > 3" class="entity-more">
            +{{ result.entities.length - 3 }} more
          </span>
        </div>
      </div>
    </div>
    
    <!-- Search mode indicator removed per user request -->
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'
import { getItemName, getItemLocation } from '../../utils.js'
import { canShowLocations } from '../../stores/globalState.js'

const props = defineProps({
  result: {
    type: Object,
    required: true
  },
  searchMode: {
    type: String,
    default: 'keyword'
  },
  showSimilarityScore: {
    type: Boolean,
    default: true
  },
  maxDescriptionLength: {
    type: Number,
    default: 150
  },
  year: {
    type: String,
    default: '2025'
  }
})

const emit = defineEmits(['navigate', 'toggleFavorite'])

const typeIcons = {
  camp: '🏠',
  art: '🎨',
  event: '🎉'
}

const searchModeLabels = {
  semantic: 'AI',
  smart: 'SMART',
  vector: 'AI'
}

const formatSimilarityScore = (score) => {
  if (typeof score !== 'number') return '0'
  return Math.round(score * 100)
}

const truncateDescription = (description) => {
  if (!description) return ''
  if (description.length <= props.maxDescriptionLength) return description
  return description.substring(0, props.maxDescriptionLength) + '...'
}

const displayLocation = computed(() => {
  const location = getItemLocation(props.result)
  if (!location || location === 'Unknown location') {
    // Check if locations are hidden for this year
    if (!canShowLocations(props.year)) {
      return 'Location Unreleased'
    }
    return 'Unknown location'
  }
  return location
})
</script>

<style scoped>
.search-result-item {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 8px 16px 16px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.search-result-item:hover {
  border-color: #8B0000;
  box-shadow: 0 2px 8px rgba(139, 0, 0, 0.3);
  background: rgba(139, 0, 0, 0.05);
  transform: translateY(-1px);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.result-type {
  font-size: 18px;
  flex-shrink: 0;
}

.result-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  display: flex;
  align-items: center;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.similarity-score {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 11px;
  color: var(--color-gold);
  font-weight: bold;
  text-transform: uppercase;
}

.score-label {
  font-weight: bold;
}

.score-value {
  font-weight: bold;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ccc;
  transition: color 0.2s ease;
  padding: 8px;
  border-radius: 6px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn:hover {
  color: #ffd700;
}

.favorite-btn.active {
  color: #ffd700;
}

.result-content {
  margin-left: 30px; /* Align with title */
}

.result-location {
  font-size: 13px;
  color: #ccc;
  margin-bottom: 6px;
  font-weight: 500;
}

.result-description {
  font-size: 14px;
  color: #ddd;
  line-height: 1.4;
  margin-bottom: 8px;
}

.result-entities {
  margin-top: 8px;
}

.entity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.entity-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.entity-location {
  background: #e3f2fd;
  color: #1976d2;
}

.entity-activity {
  background: #f3e5f5;
  color: #7b1fa2;
}

.entity-theme {
  background: #e8f5e8;
  color: #388e3c;
}

.entity-time {
  background: #fff3e0;
  color: #f57c00;
}

.entity-person {
  background: #fce4ec;
  color: #c2185b;
}

.entity-more {
  color: #666;
  font-size: 11px;
  font-style: italic;
  padding: 2px 6px;
}

/* Search mode indicator styles removed per user request */

/* Mobile optimizations */
@media (max-width: 600px) {
  .search-result-item {
    padding: 6px 12px 12px 12px;
    margin-bottom: 8px;
  }
  
  .result-header {
    gap: 8px;
  }
  
  .result-title {
    font-size: 15px;
  }
  
  .result-content {
    margin-left: 26px;
  }
  
  .similarity-score {
    font-size: 10px;
  }
  
  .entity-tags {
    gap: 3px;
  }
  
  .entity-tag {
    font-size: 10px;
    padding: 1px 4px;
  }
}

/* Touch targets for mobile */
@media (max-width: 600px) {
  .favorite-btn {
    padding: 8px;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>