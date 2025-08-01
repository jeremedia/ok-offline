<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <span v-if="icon && iconPosition === 'left'" class="btn-icon-left">{{ icon }}</span>
    <span class="btn-content"><slot /></span>
    <span v-if="icon && iconPosition === 'right'" class="btn-icon-right">{{ icon }}</span>
  </button>
</template>

<script setup>
import { computed, useSlots } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost', 'link'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  fullWidth: Boolean,
  loading: Boolean,
  disabled: Boolean,
  active: Boolean,
  icon: String,
  iconPosition: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'right'].includes(v)
  },
  type: {
    type: String,
    default: 'button'
  },
  uppercase: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click'])

const slots = useSlots()

const buttonClasses = computed(() => {
  const hasContent = !!slots.default?.()
  return [
    'btn',
    `btn-${props.variant}`,
    `btn-${props.size}`,
    {
      'btn-full': props.fullWidth,
      'btn-loading': props.loading,
      'btn-active': props.active,
      'btn-icon': props.icon && !hasContent,
      'btn-uppercase': props.uppercase
    }
  ]
})
</script>

<style>
/* Button styles are in /src/styles/components/buttons.css */
</style>