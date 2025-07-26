import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Hammer from 'hammerjs'

export function useSwipeGestures() {
  const router = useRouter()
  const route = useRoute()
  
  let hammer = null
  
  // Define the navigation order for swiping
  const navOrder = ['map', 'camps', 'art', 'events', 'schedule']
  
  const getCurrentIndex = () => {
    const currentView = route.name
    return navOrder.indexOf(currentView)
  }
  
  const navigateToIndex = (index, year) => {
    if (index >= 0 && index < navOrder.length) {
      const view = navOrder[index]
      router.push(`/${year}/${view}`)
    }
  }
  
  const handleSwipeLeft = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex !== -1) {
      const year = route.params.year || localStorage.getItem('selectedYear') || '2024'
      navigateToIndex(currentIndex + 1, year)
    }
  }
  
  const handleSwipeRight = () => {
    const currentIndex = getCurrentIndex()
    if (currentIndex !== -1) {
      const year = route.params.year || localStorage.getItem('selectedYear') || '2024'
      navigateToIndex(currentIndex - 1, year)
    }
  }
  
  onMounted(() => {
    // Only enable swipe on mobile phones (not tablets)
    const isSmallScreen = window.innerWidth < 600
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i
    const isMobileUA = mobileRegex.test(navigator.userAgent)
    
    if (isSmallScreen && hasTouch && isMobileUA) {
      // Create hammer instance on the main content area
      const mainElement = document.querySelector('main')
      if (mainElement) {
        hammer = new Hammer(mainElement)
        
        // Configure swipe gestures
        hammer.get('swipe').set({
          direction: Hammer.DIRECTION_HORIZONTAL,
          threshold: 10,
          velocity: 0.3
        })
        
        // Handle swipe events
        hammer.on('swipeleft', handleSwipeLeft)
        hammer.on('swiperight', handleSwipeRight)
      }
    }
  })
  
  onUnmounted(() => {
    if (hammer) {
      hammer.destroy()
      hammer = null
    }
  })
  
  return {
    handleSwipeLeft,
    handleSwipeRight
  }
}