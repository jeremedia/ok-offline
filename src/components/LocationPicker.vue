<template>
  <div class="location-picker">
    <div class="location-tabs">
      <button 
        @click="mode = 'intersection'"
        :class="['tab', { active: mode === 'intersection' }]"
      >
        Intersection
      </button>
      <button 
        @click="mode = 'gps'"
        :class="['tab', { active: mode === 'gps' }]"
      >
        GPS Coordinates
      </button>
    </div>
    
    <div v-if="mode === 'intersection'" class="intersection-mode">
      <div class="form-group">
        <label for="clock-position">Clock Position</label>
        <select 
          id="clock-position"
          v-model="intersection.clockPosition"
          @change="updateLocation"
          class="form-control"
        >
          <option value="">Select position</option>
          <option value="2:00">2:00</option>
          <option value="2:30">2:30</option>
          <option value="3:00">3:00</option>
          <option value="3:30">3:30</option>
          <option value="4:00">4:00</option>
          <option value="4:30">4:30</option>
          <option value="5:00">5:00</option>
          <option value="5:30">5:30</option>
          <option value="6:00">6:00</option>
          <option value="6:30">6:30</option>
          <option value="7:00">7:00</option>
          <option value="7:30">7:30</option>
          <option value="8:00">8:00</option>
          <option value="8:30">8:30</option>
          <option value="9:00">9:00</option>
          <option value="9:30">9:30</option>
          <option value="10:00">10:00</option>
          <option value="10:30">10:30</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="street">Street</label>
        <select 
          id="street"
          v-model="intersection.street"
          @change="updateLocation"
          class="form-control"
        >
          <option value="">Select street</option>
          <option value="Esplanade">Esplanade</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="D">D</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="G">G</option>
          <option value="H">H</option>
          <option value="I">I</option>
          <option value="J">J</option>
          <option value="K">K</option>
          <option value="L">L</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="intersection-type">Intersection Type</label>
        <select 
          id="intersection-type"
          v-model="intersection.type"
          @change="updateLocation"
          class="form-control"
        >
          <option value="&">&amp; (Intersection)</option>
          <option value="@">@ (Plaza)</option>
        </select>
      </div>
      
      <div v-if="locationString" class="location-preview">
        <strong>Location:</strong> {{ locationString }}
      </div>
    </div>
    
    <div v-else-if="mode === 'gps'" class="gps-mode">
      <div class="form-group">
        <label for="latitude">Latitude</label>
        <input 
          id="latitude"
          v-model.number="gps.latitude"
          @input="updateLocation"
          type="number"
          step="0.000001"
          min="-90"
          max="90"
          placeholder="40.786958"
          class="form-control"
        >
      </div>
      
      <div class="form-group">
        <label for="longitude">Longitude</label>
        <input 
          id="longitude"
          v-model.number="gps.longitude"
          @input="updateLocation"
          type="number"
          step="0.000001"
          min="-180"
          max="180"
          placeholder="-119.202994"
          class="form-control"
        >
      </div>
      
      <button 
        @click="getCurrentLocation"
        class="btn btn-secondary"
        :disabled="gettingLocation"
      >
        {{ gettingLocation ? 'Getting location...' : 'Use Current Location' }}
      </button>
      
      <div v-if="gpsError" class="error-message">
        {{ gpsError }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const mode = ref('intersection')
const gettingLocation = ref(false)
const gpsError = ref('')

const intersection = ref({
  clockPosition: '',
  street: '',
  type: '&'
})

const gps = ref({
  latitude: null,
  longitude: null
})

const locationString = computed(() => {
  if (mode.value === 'intersection' && intersection.value.clockPosition && intersection.value.street) {
    return `${intersection.value.clockPosition} ${intersection.value.type} ${intersection.value.street}`
  } else if (mode.value === 'gps' && gps.value.latitude && gps.value.longitude) {
    return `GPS: ${gps.value.latitude}, ${gps.value.longitude}`
  }
  return ''
})

const updateLocation = () => {
  let location = {}
  
  if (mode.value === 'intersection' && intersection.value.clockPosition && intersection.value.street) {
    location = {
      intersection: intersection.value.clockPosition,
      intersection_type: intersection.value.type,
      street: intersection.value.street,
      location_string: locationString.value
    }
  } else if (mode.value === 'gps' && gps.value.latitude && gps.value.longitude) {
    location = {
      gps_latitude: gps.value.latitude,
      gps_longitude: gps.value.longitude,
      location_string: locationString.value
    }
  }
  
  emit('update:modelValue', location)
}

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    gpsError.value = 'Geolocation is not supported by your browser'
    return
  }
  
  gettingLocation.value = true
  gpsError.value = ''
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })
    
    gps.value.latitude = position.coords.latitude
    gps.value.longitude = position.coords.longitude
    updateLocation()
  } catch (error) {
    gpsError.value = 'Unable to get your location. Please enter manually.'
  } finally {
    gettingLocation.value = false
  }
}

// Initialize from modelValue
watch(() => props.modelValue, (value) => {
  if (value && value.intersection) {
    mode.value = 'intersection'
    intersection.value = {
      clockPosition: value.intersection,
      street: value.street || '',
      type: value.intersection_type || '&'
    }
  } else if (value && value.gps_latitude) {
    mode.value = 'gps'
    gps.value = {
      latitude: value.gps_latitude,
      longitude: value.gps_longitude
    }
  }
}, { immediate: true })
</script>

<style scoped>
.location-picker {
  margin-bottom: 1.5rem;
}

.location-picker h3 {
  color: #ccc;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.location-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  flex: 1;
  padding: 0.5rem 1rem;
  background-color: #333;
  color: #999;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.tab.active {
  background-color: #8B0000;
  color: white;
  border-color: #8B0000;
}

.tab:hover:not(.active) {
  background-color: #444;
  color: #ccc;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: #ccc;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background-color: #333;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #8B0000;
  background-color: #3a3a3a;
}

.location-preview {
  padding: 0.75rem;
  background-color: #333;
  border-radius: 4px;
  margin-top: 1rem;
  color: #ccc;
}

.error-message {
  color: #ff6666;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-secondary {
  background-color: #444;
  color: #ccc;
  margin-top: 1rem;
  width: 100%;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #555;
  color: #fff;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>