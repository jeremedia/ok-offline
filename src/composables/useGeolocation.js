import { ref, computed } from 'vue'
import { calculateDistance, formatDistance, brcAddressToLatLon } from '../utils/geocoding'

// Store user's current location
const userLocation = ref(null)
const locationError = ref(null)
const locationLoading = ref(false)

export function useGeolocation() {
  
  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      locationError.value = 'Geolocation is not supported by your browser'
      return Promise.reject(locationError.value)
    }
    
    locationLoading.value = true
    locationError.value = null
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = [
            position.coords.latitude,
            position.coords.longitude
          ]
          locationLoading.value = false
          resolve(userLocation.value)
        },
        (error) => {
          locationError.value = error.message
          locationLoading.value = false
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )
    })
  }
  
  // Calculate distance to a BRC address
  const getDistanceTo = (brcAddress) => {
    if (!userLocation.value || !brcAddress) return null
    
    const targetCoords = brcAddressToLatLon(brcAddress)
    if (!targetCoords) return null
    
    const distanceFeet = calculateDistance(userLocation.value, targetCoords)
    return {
      feet: distanceFeet,
      formatted: formatDistance(distanceFeet)
    }
  }
  
  // Calculate bearing to a location
  const getBearingTo = (brcAddress) => {
    if (!userLocation.value || !brcAddress) return null
    
    const targetCoords = brcAddressToLatLon(brcAddress)
    if (!targetCoords) return null
    
    const [lat1, lon1] = userLocation.value
    const [lat2, lon2] = targetCoords
    
    const dLon = (lon2 - lon1) * Math.PI / 180
    const lat1Rad = lat1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI
    return (bearing + 360) % 360
  }
  
  // Get compass direction
  const getCompassDirection = (bearing) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }
  
  // Sort items by distance
  const sortByDistance = (items, getLocation) => {
    if (!userLocation.value) return items
    
    return [...items].sort((a, b) => {
      const locA = getLocation(a)
      const locB = getLocation(b)
      
      const distA = getDistanceTo(locA)
      const distB = getDistanceTo(locB)
      
      if (!distA) return 1
      if (!distB) return -1
      
      return distA.feet - distB.feet
    })
  }
  
  return {
    userLocation: computed(() => userLocation.value),
    locationError: computed(() => locationError.value),
    locationLoading: computed(() => locationLoading.value),
    getCurrentLocation,
    getDistanceTo,
    getBearingTo,
    getCompassDirection,
    sortByDistance
  }
}