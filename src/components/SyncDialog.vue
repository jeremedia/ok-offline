<template>
  <div v-if="show" class="sync-dialog-overlay">
    <div class="sync-dialog">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="spinner"></div>
      <p class="sync-status">{{ status }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Syncing Data'
  },
  message: {
    type: String,
    default: 'This may take a moment...'
  },
  status: {
    type: String,
    default: 'Downloading...'
  }
})
</script>

<style scoped>
.sync-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.sync-dialog {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  border: 1px solid var(--color-border);
}

.sync-dialog h2 {
  margin: 0 0 1rem 0;
  color: var(--color-text-primary);
}

.sync-dialog p {
  margin: 0.5rem 0;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 1.5rem auto;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.sync-status {
  font-size: 0.9rem;
  color: var(--color-accent-light);
}
</style>