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
}

/* Horizontal button group */
.button-group-horizontal {
  flex-direction: row;
}

.button-group-horizontal > :deep(.btn) {
  border-radius: 0;
  margin-left: -1px;
}

.button-group-horizontal > :deep(.btn:first-child) {
  margin-left: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.button-group-horizontal > :deep(.btn:last-child) {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Vertical button group */
.button-group-vertical {
  flex-direction: column;
}

.button-group-vertical > :deep(.btn) {
  width: 100%;
  border-radius: 0;
  margin-top: -1px;
  margin-bottom: 0;
}

.button-group-vertical > :deep(.btn:first-child) {
  margin-top: 0;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.button-group-vertical > :deep(.btn:last-child) {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Ensure proper stacking on hover */
.button-group .btn:hover {
  z-index: 1;
  position: relative;
}

/* Fix border overlaps for better appearance */
.button-group-vertical > :deep(.btn) {
  border-bottom-width: 0;
}

.button-group-vertical > :deep(.btn:last-child) {
  border-bottom-width: 1px;
}

.button-group-horizontal > :deep(.btn) {
  border-right-width: 0;
}

.button-group-horizontal > :deep(.btn:last-child) {
  border-right-width: 1px;
}

/* Override any button-specific margins */
.button-group > :deep(.btn) {
  flex: 0 0 auto;
}

/* For full-width buttons in vertical groups */
.button-group-vertical > :deep(.btn-full) {
  flex: 1 0 auto;
}
</style>