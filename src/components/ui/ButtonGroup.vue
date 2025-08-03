<template>
  <div :class="['button-group', `button-group-${direction}`]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v)
  }
})
</script>

<style scoped>
.button-group {
  display: flex;
  width: 100%;
  border: 1px solid var(--color-border-heavy);
  border-radius: 4px;
  overflow: hidden;
}

/* Horizontal button group */
.button-group-horizontal {
  flex-direction: row;
}

.button-group-horizontal > :deep(.btn) {
  border: none;
  border-radius: 0;
  border-right: 1px solid var(--color-border-heavy);
}

.button-group-horizontal > :deep(.btn:last-child) {
  border-right: none;
}

/* Vertical button group */
.button-group-vertical {
  flex-direction: column;
}

.button-group-vertical > :deep(.btn) {
  width: 100%;
  border: none;
  border-radius: 0;
  border-bottom: 1px solid var(--color-border-heavy);
}

.button-group-vertical > :deep(.btn:last-child) {
  border-bottom: none;
}

/* Ensure proper stacking on hover */
.button-group > :deep(.btn:hover) {
  z-index: 1;
  position: relative;
}

/* Make buttons flex to fill container */
.button-group > :deep(.btn) {
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* For full-width buttons in vertical groups */
.button-group-vertical > :deep(.btn) {
  flex: 1 0 auto;
}
</style>