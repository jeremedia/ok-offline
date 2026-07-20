import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CURRENT_YEAR, SUPPORTED_YEARS } from '../config/seasons'

export function useKeyboardShortcuts() {
  const router = useRouter()
  const route = useRoute()
  
  const handleKeyPress = (event) => {
    // Ignore if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return
    }
    
    const year = route.params.year || localStorage.getItem('selectedYear') || CURRENT_YEAR
    
    // Navigation shortcuts
    switch(event.key.toLowerCase()) {
      case 'm':
        // Map view
        router.push(`/${year}/map`)
        break
      case 'c':
        // Camps list
        router.push(`/${year}/camps`)
        break
      case 'a':
        // Art list
        router.push(`/${year}/art`)
        break
      case 'e':
        // Events list
        router.push(`/${year}/events`)
        break
      case 's':
        // Search
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
        }
        router.push(`/${year}/search`)
        break
      case '/':
        // Also activate search
        event.preventDefault()
        router.push(`/${year}/search`)
        break
      case 'g':
        // Settings
        router.push('/settings')
        break
      case '?':
        // Show help
        if (event.shiftKey) {
          showShortcutsHelp()
        }
        break
      case 'escape':
        // Go back
        if (route.name && route.name.includes('detail')) {
          router.back()
        }
        break
    }
    
    // Year switching
    if (event.key >= '1' && event.key <= String(SUPPORTED_YEARS.length) && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      const newYear = [...SUPPORTED_YEARS].reverse()[parseInt(event.key) - 1]
      if (newYear) {
        localStorage.setItem('selectedYear', newYear)
        const currentPath = route.path
        const newPath = currentPath.replace(/\/\d{4}\//, `/${newYear}/`)
        if (newPath !== currentPath) {
          router.push(newPath)
        } else {
          router.push(`/${newYear}/map`)
        }
      }
    }
  }
  
  const showShortcutsHelp = () => {
    const shortcuts = `
Keyboard Shortcuts:

Navigation:
• M - Map view
• C - Camps list
• A - Art list
• E - Events list
• S or / - Search
• G - Settings (includes Emergency tab)
• ESC - Go back

Year Switching:
• Ctrl/Cmd + 1 - 2023
• Ctrl/Cmd + 2 - 2024
• Ctrl/Cmd + 3 - 2025
• Ctrl/Cmd + 4 - 2026

Other:
• ? - Show this help
    `
    alert(shortcuts)
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyPress)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
  })
  
  return {
    showShortcutsHelp
  }
}
