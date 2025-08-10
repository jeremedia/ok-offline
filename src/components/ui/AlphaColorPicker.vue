<template>
  <div class="alpha-color-picker">
    <!-- Color Preview -->
    <div class="color-preview" :style="{ backgroundColor: rgba }"></div>
    
    <!-- RGB Color Picker -->
    <input
      type="color"
      :value="hexValue"
      @input="onColorChange"
      class="color-input"
    />
    
    <!-- Alpha Slider -->
    <div class="alpha-control">
      <label class="alpha-label">Alpha</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="alpha"
        @input="onAlphaChange"
        class="alpha-slider"
      />
      <span class="alpha-value">{{ Math.round(alpha * 100) }}%</span>
    </div>
    
    <!-- Text Input -->
    <input
      type="text"
      :value="displayValue"
      @input="onTextInput"
      @blur="validateTextInput"
      class="color-text-input"
      :placeholder="isRgba ? 'rgba(255,0,0,0.5)' : '#ff0000'"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '#000000'
  }
})

const emit = defineEmits(['update:modelValue'])

// Parse the input color value
const parseColor = (color) => {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 }
  
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return { r, g, b, a: 1 }
  }
  
  // Handle rgba colors
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    }
  }
  
  return { r: 0, g: 0, b: 0, a: 1 }
}

const colorValues = ref(parseColor(props.modelValue))

// Computed values
const hexValue = computed(() => {
  const { r, g, b } = colorValues.value
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
})

const alpha = computed(() => colorValues.value.a)

const rgba = computed(() => {
  const { r, g, b, a } = colorValues.value
  return `rgba(${r}, ${g}, ${b}, ${a})`
})

const isRgba = computed(() => colorValues.value.a < 1)

const displayValue = computed(() => {
  if (isRgba.value) {
    return rgba.value
  } else {
    return hexValue.value
  }
})

// Event handlers
const onColorChange = (event) => {
  const hex = event.target.value
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  
  colorValues.value = { ...colorValues.value, r, g, b }
  emitColor()
}

const onAlphaChange = (event) => {
  colorValues.value = { ...colorValues.value, a: parseFloat(event.target.value) }
  emitColor()
}

const onTextInput = (event) => {
  const newColor = parseColor(event.target.value)
  colorValues.value = newColor
  emitColor()
}

const validateTextInput = (event) => {
  // Re-parse and validate the input
  const parsed = parseColor(event.target.value)
  colorValues.value = parsed
  emitColor()
}

const emitColor = () => {
  emit('update:modelValue', displayValue.value)
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  colorValues.value = parseColor(newValue)
})
</script>

<style scoped>
.alpha-color-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.color-preview {
  width: 100%;
  height: 32px;
  border: 2px solid var(--color-border-medium);
  border-radius: 4px;
  background: 
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.color-input {
  width: 60px;
  height: 36px;
  border: 2px solid var(--color-border-heavy);
  border-radius: 4px;
  cursor: pointer;
  background: none;
  padding: 0;
}

.alpha-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alpha-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  min-width: 40px;
}

.alpha-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: linear-gradient(
    to right,
    transparent 0%,
    var(--color-primary) 100%
  );
  border-radius: 3px;
  outline: none;
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
}

.alpha-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--color-accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.alpha-value {
  font-size: 0.8rem;
  color: var(--color-accent);
  min-width: 40px;
  text-align: right;
}

.color-text-input {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.85rem;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-family: 'Berkeley Mono', monospace;
}

.color-text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-bg-elevated);
}
</style>