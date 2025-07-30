<template>
  <CustomEntryForm
    v-model="show"
    :year="props.year"
    entry-type="camp"
    name-label="Camp Name"
    name-placeholder="e.g., Dusty Oasis"
    description-placeholder="What makes this camp special?"
    contact-placeholder="camp@example.com"
    :show-url-field="true"
    :additional-fields="{ hometown: '' }"
    @saved="handleSaved"
  >
    <template #type-fields="{ formData, errors }">
      <div class="form-group">
        <label for="camp-hometown">Hometown</label>
        <input
          id="camp-hometown"
          v-model="formData.hometown"
          type="text"
          class="form-control"
          placeholder="e.g., San Francisco, CA"
          autocomplete="off"
        >
      </div>
    </template>
  </CustomEntryForm>
</template>

<script setup>
import { computed } from 'vue'
import CustomEntryForm from './CustomEntryForm.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  year: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSaved = (uid) => {
  emit('saved', uid)
}
</script>