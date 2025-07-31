<template>
  <CustomEntryForm
    v-model="show"
    :year="props.year"
    entry-type="event"
    name-label="Event Title"
    name-placeholder="e.g., Sunrise Yoga"
    description-placeholder="What happens at this event?"
    contact-placeholder="event@example.com"
    :show-url-field="false"
    :additional-fields="{ 
      camp_name: '',
      event_type: { label: '', abbr: '' },
      occurrence_set: []
    }"
    @saved="handleSaved"
  >
    <template #type-fields="{ formData, errors, updateField }">
      <div class="form-group">
        <label for="event-camp">Host Camp (Optional)</label>
        <input
          id="event-camp"
          v-model="formData.camp_name"
          type="text"
          class="form-control"
          placeholder="e.g., Dusty Oasis"
          autocomplete="off"
        >
      </div>
      
      <div class="form-group">
        <label for="event-type" class="required">Event Type</label>
        <select
          id="event-type"
          v-model="selectedEventType"
          @change="updateEventType(updateField)"
          class="form-control"
          required
        >
          <option value="">Select event type</option>
          <option value="work">Class/Workshop</option>
          <option value="prty">Music/Party</option>
          <option value="food">Food</option>
          <option value="care">Self Care</option>
          <option value="game">Games</option>
          <option value="yoga">Yoga/Movement</option>
          <option value="arts">Arts & Crafts</option>
          <option value="cere">Ritual/Ceremony</option>
          <option value="live">Live Music</option>
          <option value="perf">Performance</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="event-date" class="required">Date & Time</label>
        <div class="datetime-inputs">
          <input
            id="event-date"
            v-model="eventDate"
            @change="updateDateTime(updateField)"
            type="date"
            class="form-control"
            :min="minDate"
            :max="maxDate"
            required
          >
          <input
            v-model="eventTime"
            @change="updateDateTime(updateField)"
            type="time"
            class="form-control"
            required
          >
        </div>
        <small class="form-text">Burning Man 2025: Aug 25 - Sep 2</small>
      </div>
      
      <div class="form-group">
        <label for="event-duration">Duration</label>
        <select
          id="event-duration"
          v-model="eventDuration"
          @change="updateDateTime(updateField)"
          class="form-control"
        >
          <option value="30">30 minutes</option>
          <option value="60" selected>1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
          <option value="180">3 hours</option>
          <option value="240">4 hours</option>
          <option value="0">All day</option>
        </select>
      </div>
    </template>
  </CustomEntryForm>
</template>

<script setup>
import { ref, computed } from 'vue'
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

// Event-specific data
const selectedEventType = ref('')
const eventDate = ref('')
const eventTime = ref('')
const eventDuration = ref('60')

// Burning Man 2025 dates
const minDate = '2025-08-25'
const maxDate = '2025-09-02'

const eventTypeMap = {
  work: 'Class/Workshop',
  prty: 'Music/Party',
  food: 'Food',
  care: 'Self Care',
  game: 'Games',
  yoga: 'Yoga/Movement',
  arts: 'Arts & Crafts',
  cere: 'Ritual/Ceremony',
  live: 'Live Music',
  perf: 'Performance'
}

const updateEventType = (updateField) => {
  if (selectedEventType.value) {
    updateField('event_type', {
      label: eventTypeMap[selectedEventType.value],
      abbr: selectedEventType.value
    })
  }
}

const updateDateTime = (updateField) => {
  if (eventDate.value && eventTime.value) {
    const startDateTime = new Date(`${eventDate.value}T${eventTime.value}:00`)
    const endDateTime = new Date(startDateTime)
    
    if (eventDuration.value === '0') {
      // All day event
      endDateTime.setHours(23, 59, 59)
    } else {
      // Add duration in minutes
      endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(eventDuration.value))
    }
    
    updateField('occurrence_set', [{
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString()
    }])
  }
}

const handleSaved = (uid) => {
  // Reset event-specific fields
  selectedEventType.value = ''
  eventDate.value = ''
  eventTime.value = ''
  eventDuration.value = '60'
  
  emit('saved', uid)
}
</script>

<style scoped>
.datetime-inputs {
  display: flex;
  gap: 8px;
}

.datetime-inputs input[type="date"] {
  flex: 1.5;
}

.datetime-inputs input[type="time"] {
  flex: 1;
}

.form-text {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
</style>