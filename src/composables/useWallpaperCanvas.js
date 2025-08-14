import { ref, computed, watch } from 'vue'

export function useWallpaperCanvas() {
  // Canvas and context refs
  const canvas = ref(null)
  const ctx = ref(null)
  
  // Wallpaper settings
  const settings = ref({
    // Device presets
    deviceType: 'iphone14', // iphone14, iphone15pro, android, custom
    width: 1170,
    height: 2532,
    
    // Background
    backgroundType: 'color', // preset, upload, color
    backgroundImage: null,
    backgroundColor: '#1a0033', // Dark purple default
    backgroundPosition: { x: 50, y: 50 }, // percentage
    backgroundScale: 1,
    backgroundOpacity: 1,
    
    // Text settings
    campName: 'OKNOTOK',
    campLocation: '3:30 & A',
    line1Text: 'ABBY / BOOTTY',
    line2Text: 'PLEASE RETURN TO',
    
    // Text styling
    fontFamily: 'Berkeley Mono, monospace',
    textColor: '#FFD700',
    textShadow: true,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textAlign: 'center',
    
    // Text sizes (relative to canvas height)
    campNameSize: 0.08,
    campLocationSize: 0.06,
    line1Size: 0.05,
    line2Size: 0.04,
    
    // Layout
    topMargin: 0.15, // Safe area for notch
    bottomMargin: 0.1,
    textSpacing: 0.02
  })
  
  // Device presets
  const devicePresets = {
    iphone14: { width: 1170, height: 2532, name: 'iPhone 14/15' },
    iphone15pro: { width: 1290, height: 2796, name: 'iPhone 15 Pro' },
    iphoneSE: { width: 750, height: 1334, name: 'iPhone SE' },
    android: { width: 1080, height: 2400, name: 'Android' },
    androidTablet: { width: 1600, height: 2560, name: 'Android Tablet' },
    custom: { width: 1170, height: 2532, name: 'Custom' }
  }
  
  // Initialize canvas
  const initCanvas = (canvasElement) => {
    if (!canvasElement) return
    
    canvas.value = canvasElement
    ctx.value = canvasElement.getContext('2d')
    
    // Set canvas size
    updateCanvasSize()
    
    // Initial render
    renderWallpaper()
  }
  
  // Update canvas size based on device preset
  const updateCanvasSize = () => {
    if (!canvas.value) return
    
    const preset = devicePresets[settings.value.deviceType]
    if (preset) {
      settings.value.width = preset.width
      settings.value.height = preset.height
    }
    
    canvas.value.width = settings.value.width
    canvas.value.height = settings.value.height
  }
  
  // Load background image
  const loadBackgroundImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
  
  // Render the wallpaper
  const renderWallpaper = async () => {
    if (!ctx.value || !canvas.value) return
    
    const { width, height } = settings.value
    
    // Clear canvas
    ctx.value.clearRect(0, 0, width, height)
    
    // Draw background
    if (settings.value.backgroundType === 'color') {
      ctx.value.fillStyle = settings.value.backgroundColor
      ctx.value.fillRect(0, 0, width, height)
    } else if (settings.value.backgroundImage) {
      try {
        const img = await loadBackgroundImage(settings.value.backgroundImage)
        
        // Calculate scaled dimensions maintaining aspect ratio
        const scale = settings.value.backgroundScale
        const imgAspect = img.width / img.height
        const canvasAspect = width / height
        
        let drawWidth, drawHeight
        if (imgAspect > canvasAspect) {
          // Image is wider
          drawHeight = height * scale
          drawWidth = drawHeight * imgAspect
        } else {
          // Image is taller
          drawWidth = width * scale
          drawHeight = drawWidth / imgAspect
        }
        
        // Calculate position
        const x = (width - drawWidth) * (settings.value.backgroundPosition.x / 100)
        const y = (height - drawHeight) * (settings.value.backgroundPosition.y / 100)
        
        // Set opacity
        ctx.value.globalAlpha = settings.value.backgroundOpacity
        
        // Draw image
        ctx.value.drawImage(img, x, y, drawWidth, drawHeight)
        
        // Reset opacity
        ctx.value.globalAlpha = 1
      } catch (error) {
        console.error('Failed to load background image:', error)
      }
    }
    
    // Draw overlay gradient for better text visibility
    const gradient = ctx.value.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)')
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)')
    ctx.value.fillStyle = gradient
    ctx.value.fillRect(0, 0, width, height)
    
    // Set text properties
    ctx.value.textAlign = settings.value.textAlign
    ctx.value.fillStyle = settings.value.textColor
    
    // Calculate positions
    const topY = height * settings.value.topMargin
    const spacing = height * settings.value.textSpacing
    
    // Draw text with shadow if enabled
    const drawText = (text, x, y, fontSize) => {
      ctx.value.font = `bold ${fontSize}px ${settings.value.fontFamily}`
      
      if (settings.value.textShadow) {
        ctx.value.shadowColor = settings.value.textShadowColor
        ctx.value.shadowBlur = 10
        ctx.value.shadowOffsetX = 2
        ctx.value.shadowOffsetY = 2
      }
      
      ctx.value.fillText(text, x, y)
      
      // Reset shadow
      ctx.value.shadowColor = 'transparent'
      ctx.value.shadowBlur = 0
      ctx.value.shadowOffsetX = 0
      ctx.value.shadowOffsetY = 0
    }
    
    // Draw "THIS GADGET BELONGS TO" or custom line 2
    const line2Y = topY
    drawText(
      settings.value.line2Text,
      width / 2,
      line2Y,
      height * settings.value.line2Size
    )
    
    // Draw name/playa name (line 1)
    const line1Y = line2Y + spacing + (height * settings.value.line1Size)
    drawText(
      settings.value.line1Text,
      width / 2,
      line1Y,
      height * settings.value.line1Size
    )
    
    // Draw "PLEASE RETURN TO" or similar
    const returnTextY = line1Y + spacing * 2 + (height * settings.value.line2Size)
    drawText(
      'PLEASE RETURN TO',
      width / 2,
      returnTextY,
      height * settings.value.line2Size
    )
    
    // Draw camp name
    const campNameY = returnTextY + spacing + (height * settings.value.campNameSize)
    drawText(
      settings.value.campName,
      width / 2,
      campNameY,
      height * settings.value.campNameSize
    )
    
    // Draw camp location
    const campLocationY = campNameY + spacing + (height * settings.value.campLocationSize)
    drawText(
      settings.value.campLocation,
      width / 2,
      campLocationY,
      height * settings.value.campLocationSize
    )
  }
  
  // Export wallpaper as PNG
  const exportWallpaper = (filename = 'wallpaper.png') => {
    if (!canvas.value) return
    
    canvas.value.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png', 1.0)
  }
  
  // Handle background upload
  const handleBackgroundUpload = (file) => {
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      settings.value.backgroundImage = e.target.result
      settings.value.backgroundType = 'upload'
      renderWallpaper()
    }
    reader.readAsDataURL(file)
  }
  
  // Set preset background
  const setPresetBackground = (imagePath) => {
    settings.value.backgroundImage = imagePath
    settings.value.backgroundType = 'preset'
    renderWallpaper()
  }
  
  // Watch for settings changes
  watch(settings, () => {
    renderWallpaper()
  }, { deep: true })
  
  // Watch for device type changes
  watch(() => settings.value.deviceType, () => {
    updateCanvasSize()
    renderWallpaper()
  })
  
  return {
    canvas,
    ctx,
    settings,
    devicePresets,
    initCanvas,
    renderWallpaper,
    exportWallpaper,
    handleBackgroundUpload,
    setPresetBackground,
    updateCanvasSize
  }
}