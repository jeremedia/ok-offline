<template>
  <CustomEntryForm
    v-model="show"
    :year="props.year"
    entry-type="art"
    name-label="Art Installation Name"
    name-placeholder="e.g., Temple of Gravity"
    description-placeholder="Describe your art installation..."
    contact-placeholder="artist@example.com"
    :show-url-field="true"
    :additional-fields="{ artist: '', artist_location: '' }"
    @saved="handleSaved"
  >
    <template #type-fields="{ formData, errors }">
      <div class="form-group">
        <label for="art-artist" class="required">Artist Name</label>
        <input
          id="art-artist"
          v-model="formData.artist"
          type="text"
          class="form-control"
          placeholder="e.g., Jane Doe"
          required
          autocomplete="off"
        >
        <div v-if="errors.artist" class="error-message">{{ errors.artist }}</div>
      </div>
      
      <div class="form-group">
        <label for="art-artist-location">Artist Location</label>
        <input
          id="art-artist-location"
          v-model="formData.artist_location"
          type="text"
          class="form-control"
          placeholder="e.g., Oakland, CA"
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