<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :class="cardClasses"
    @click="handleClick"
  >
    <div v-if="$slots.header || title || icon" class="card-header">
      <slot name="header">
        <span v-if="icon" class="card-icon">{{ icon }}</span>
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer || $slots.actions || meta" class="card-footer">
      <slot name="footer">
        <div v-if="meta" class="card-meta">{{ meta }}</div>
        <div v-if="$slots.actions" class="card-actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'elevated',
    validator: (v) => ['elevated', 'flat', 'outlined', 'danger'].includes(v)
  },
  interactive: Boolean,
  compact: Boolean,
  title: String,
  icon: String,
  meta: String,
  noPadding: Boolean
})

const emit = defineEmits(['click'])

const cardClasses = computed(() => [
  'card',
  `card-${props.variant}`,
  {
    'card-interactive': props.interactive,
    'card-compact': props.compact,
    'card-no-padding': props.noPadding
  }
])

const handleClick = (event) => {
  if (props.interactive) {
    emit('click', event)
  }
}
</script>

<style>
/* Card styles are in /src/styles/components/cards.css */
</style>