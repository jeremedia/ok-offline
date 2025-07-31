<template>
  <FormModal
    v-model="show"
    :title="`Add Custom ${capitalize(props.entryType)}`"
    :is-valid="isFormValid"
    :saving="saving"
    @save="handleSave"
  >
    <form @submit.prevent="handleSave" class="custom-form">
      <!-- Primary Information -->
      <div class="form-section">
        <h3 class="section-title">{{ sectionTitle }}</h3>
        
        <div class="form-group">
          <label :for="`${entryType}-name`" class="required">{{ nameLabel }}</label>
          <input
            :id="`${entryType}-name`"
            v-model="formData.name"
            type="text"
            class="form-control"
            :placeholder="namePlaceholder"
            required
            autocomplete="off"
          >
          <div v-if="errors.name" class="error-message">{{ errors.name }}</div>
        </div>
        
        <div class="form-group">
          <label :for="`${entryType}-description`">Description</label>
          <textarea
            :id="`${entryType}-description`"
            v-model="formData.description"
            class="form-control"
            rows="3"
            :placeholder="descriptionPlaceholder"
          ></textarea>
        </div>
        
        <!-- Type-specific fields -->
        <slot name="type-fields" :formData="formData" :errors="errors" :updateField="updateField"></slot>
      </div>
      
      <!-- Location Section -->
      <div class="form-section">
        <h3 class="section-title">Location</h3>
        <LocationPicker 
          v-model="formData.location"
          @update:modelValue="handleLocationUpdate"
        />
        <div v-if="formData.location_string" class="location-preview">
          Location: {{ formData.location_string }}
        </div>
      </div>
      
      <!-- Additional Information -->
      <div class="form-section">
        <h3 class="section-title">Additional Info</h3>
        
        <div class="form-group">
          <label :for="`${entryType}-contact`">Contact Email</label>
          <input
            :id="`${entryType}-contact`"
            v-model="formData.contact_email"
            type="email"
            class="form-control"
            :placeholder="contactPlaceholder"
            autocomplete="email"
          >
          <div v-if="errors.contact_email" class="error-message">{{ errors.contact_email }}</div>
        </div>
        
        <div class="form-group" v-if="showUrlField">
          <label :for="`${entryType}-url`">Website</label>
          <input
            :id="`${entryType}-url`"
            v-model="formData.url"
            type="url"
            class="form-control"
            placeholder="https:// ..."
            autocomplete="url"
          >
          <div v-if="errors.url" class="error-message">{{ errors.url }}</div>
        </div>
        
        <div class="form-group">
          <label :for="`${entryType}-notes`">Personal Notes</label>
          <textarea
            :id="`${entryType}-notes`"
            v-model="formData.notes"
            class="form-control"
            rows="2"
            placeholder="Any additional notes for yourself..."
          ></textarea>
        </div>
      </div>
      
      <!-- Custom Entry Notice -->
      <div class="custom-notice">
        <span class="custom-badge">
          <span class="badge-icon">✏️</span>
          <span class="badge-text">CUSTOM ENTRY</span>
        </span>
        <p>This {{ entryType }} will be saved locally and marked as a custom entry.</p>
      </div>
    </form>
  </FormModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FormModal from '../FormModal.vue'
import LocationPicker from '../LocationPicker.vue'
import { saveCustomEntry } from '../../services/customEntries'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  year: {
    type: String,
    required: true
  },
  entryType: {
    type: String,
    required: true,
    validator: (value) => ['camp', 'art', 'event'].includes(value)
  },
  // Configuration props
  nameLabel: {
    type: String,
    default: 'Name'
  },
  namePlaceholder: {
    type: String,
    default: ''
  },
  descriptionPlaceholder: {
    type: String,
    default: 'Describe this entry...'
  },
  contactPlaceholder: {
    type: String,
    default: 'contact@example.com'
  },
  showUrlField: {
    type: Boolean,
    default: true
  },
  additionalFields: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { showSuccess, showError } = useToast()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const sectionTitle = computed(() => {
  const titles = {
    camp: 'Camp Details',
    art: 'Art Installation Details',
    event: 'Event Details'
  }
  return titles[props.entryType] || 'Details'
})

const formData = ref({
  name: '',
  description: '',
  location: {},
  location_string: '',
  contact_email: '',
  url: '',
  notes: '',
  ...props.additionalFields
})

const errors = ref({})
const saving = ref(false)

const isFormValid = computed(() => {
  return formData.value.name && formData.value.name.trim().length > 0
})

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

const updateField = (field, value) => {
  formData.value[field] = value
}

const handleLocationUpdate = (location) => {
  if (location.intersection && location.street) {
    formData.value.location_string = `${location.intersection} ${location.intersection_type || '&'} ${location.street}`
  } else if (location.gps_latitude && location.gps_longitude) {
    formData.value.location_string = `GPS: ${location.gps_latitude}, ${location.gps_longitude}`
  } else {
    formData.value.location_string = ''
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = `${props.nameLabel} is required`
    return false
  }
  
  if (formData.value.url && !isValidUrl(formData.value.url)) {
    errors.value.url = 'Please enter a valid URL'
    return false
  }
  
  if (formData.value.contact_email && !isValidEmail(formData.value.contact_email)) {
    errors.value.contact_email = 'Please enter a valid email'
    return false
  }
  
  return true
}

const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch (_) {
    return false
  }
}

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

const handleSave = async () => {
  if (!validateForm()) {
    return
  }
  
  saving.value = true
  
  try {
    // Create a plain object without Vue reactivity
    const entryData = {
      name: formData.value.name,
      title: formData.value.name, // For events
      description: formData.value.description,
      location: { ...formData.value.location },
      location_string: formData.value.location_string,
      contact_email: formData.value.contact_email,
      url: formData.value.url,
      notes: formData.value.notes,
      year: props.year,
      // Include any additional fields passed via props
      ...Object.keys(props.additionalFields).reduce((acc, key) => {
        acc[key] = formData.value[key]
        return acc
      }, {})
    }
    
    const uid = await saveCustomEntry(props.entryType, entryData)
    
    showSuccess(`Custom ${props.entryType} added successfully!`)
    
    // Reset form
    formData.value = {
      name: '',
      description: '',
      location: {},
      location_string: '',
      contact_email: '',
      url: '',
      notes: '',
      ...props.additionalFields
    }
    
    // Close modal and emit saved event
    show.value = false
    emit('saved', uid)
  } catch (error) {
    console.error(`Error saving custom ${props.entryType}:`, error)
    showError(`Failed to save custom ${props.entryType}. Please try again.`)
  } finally {
    saving.value = false
  }
}

// Reset form when modal is closed
watch(show, (newValue) => {
  if (!newValue) {
    errors.value = {}
  }
})
</script>

<style scoped>
.custom-form {
  padding: 0;
}

.form-section {
  margin-bottom: 2rem;
}

.form-section:last-of-type {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem 0;
}

.form-group,
:deep(.form-group) {
  margin-bottom: 1rem;
}

.form-group label,
:deep(.form-group label) {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group label.required::after,
:deep(.form-group label.required::after) {
  content: ' *';
  color: var(--color-error-light);
}

.form-control,
:deep(.form-control) {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-bg-header);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-control:focus,
:deep(.form-control:focus) {
  outline: none;
  border-color: var(--color-primary);
  background-color: var(--color-background-form-focus);
}

.form-control::placeholder,
:deep(.form-control::placeholder) {
  color: var(--color-text-disabled);
}

textarea.form-control,
:deep(textarea.form-control) {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: var(--color-error-light);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.location-preview {
  padding: 0.75rem;
  background-color: var(--color-bg-elevated);
  border-radius: 4px;
  margin-top: 1rem;
  color: var(--color-accent-light);
  font-size: 0.9rem;
}

.custom-notice {
  background-color: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  margin-top: 1rem;
}

.custom-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.875rem;
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  border-radius: 20px;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.badge-icon {
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-right: 0.375rem;
}

.badge-text {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  line-height: 1;
  display: flex;
  align-items: center;
}

.custom-notice p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}
</style>