<template>
  <div class="infrastructure-card" @click="$emit('click')">
    <div class="card-header">
      <span class="card-icon">{{ item.icon }}</span>
      <h3 class="card-title">{{ item.name }}</h3>
    </div>
    
    <div class="card-body">
      <p class="card-description">{{ item.shortDescription }}</p>
      
      <div class="card-meta">
        <span class="category-badge">{{ getCategoryDisplay(item.category) }}</span>
        <span v-if="distance !== null" class="distance">
          {{ formatDistance(distance) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCategoryDisplayName } from '../../services/infrastructure'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  distance: {
    type: Number,
    default: null
  }
})

defineEmits(['click'])

// Methods
const getCategoryDisplay = (category) => {
  return getCategoryDisplayName(category)
}

const formatDistance = (dist) => {
  if (dist < 1000) {
    return `${dist} ft`
  }
  return `${(dist / 5280).toFixed(1)} mi`
}
</script>

<style scoped>
.infrastructure-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.infrastructure-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-medium);
  border-color: var(--color-bg-active);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.card-title {
  font-size: 1.25rem;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-description {
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
  flex: 1;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.category-badge {
  background: var(--color-bg-base);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border-light);
}

.distance {
  color: var(--color-primary);
  font-weight: bold;
  font-size: 0.9rem;
}

/* Mobile styles */
@media (max-width: 600px) {
  .infrastructure-card {
    padding: 1rem;
  }
  
  .card-icon {
    font-size: 2rem;
  }
  
  .card-title {
    font-size: 1.1rem;
  }
  
  .card-description {
    font-size: 0.95rem;
  }
}
</style>