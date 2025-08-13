import { ref, computed } from 'vue'

// Global date override state
const dateOverrideEnabled = ref(false)
const overrideDate = ref(new Date().toISOString().split('T')[0]) // Today as YYYY-MM-DD

// Load saved state from localStorage
const savedEnabled = localStorage.getItem('dateOverrideEnabled')
const savedDate = localStorage.getItem('overrideDate')

if (savedEnabled === 'true') {
  dateOverrideEnabled.value = true
}

if (savedDate) {
  overrideDate.value = savedDate
}

export function useDateOverride() {
  
  const toggleDateOverride = () => {
    dateOverrideEnabled.value = !dateOverrideEnabled.value
    localStorage.setItem('dateOverrideEnabled', dateOverrideEnabled.value.toString())
    console.log(`📅 Date Override ${dateOverrideEnabled.value ? 'ENABLED' : 'DISABLED'}`)
    if (dateOverrideEnabled.value) {
      console.log(`📅 Override date: ${overrideDate.value}`)
    }
  }
  
  const setOverrideDate = (dateString) => {
    overrideDate.value = dateString
    localStorage.setItem('overrideDate', dateString)
    console.log(`📅 Override date set to: ${dateString}`)
  }
  
  const getCurrentTime = () => {
    if (dateOverrideEnabled.value) {
      // Create a date object from the override date at current time
      const [year, month, day] = overrideDate.value.split('-').map(Number)
      const now = new Date()
      return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds())
    }
    return new Date()
  }
  
  const getCurrentDate = () => {
    if (dateOverrideEnabled.value) {
      const [year, month, day] = overrideDate.value.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    return new Date()
  }
  
  return {
    dateOverrideEnabled,
    overrideDate,
    toggleDateOverride,
    setOverrideDate,
    getCurrentTime,
    getCurrentDate
  }
}