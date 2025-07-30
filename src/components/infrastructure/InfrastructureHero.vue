<template>
  <div class="infrastructure-hero">
    <div class="hero-content">
      <div class="hero-icon" @click="goToInfrastructure" title="Back to Infrastructure">{{ item.icon }}</div>
      <div class="hero-info">
        <h1 class="hero-title">{{ item.name }}</h1>
        <p class="hero-category">{{ getCategoryDisplay(item.category) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { getCategoryDisplayName } from '../../services/infrastructure'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const route = useRoute()

// Methods
const getCategoryDisplay = (category) => {
  return getCategoryDisplayName(category)
}

const goToInfrastructure = () => {
  router.push(`/${route.params.year}/infrastructure`)
}
</script>

<style scoped>
.infrastructure-hero {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #444;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.hero-icon {
  font-size: 4rem;
  line-height: 1;
  background: #8B0000;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hero-icon:hover {
  background: #a00000;
  transform: scale(1.05);
}

.hero-info {
  flex: 1;
}

.hero-title {
  font-size: 2.5rem;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.hero-category {
  color: var(--color-gold);
  font-size: 1.1rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Mobile styles */
@media (max-width: 600px) {
  .infrastructure-hero {
    padding: 1.5rem 1rem;
  }
  
  .hero-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .hero-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-category {
    font-size: 1rem;
  }
}
</style>