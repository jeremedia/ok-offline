<template>
  <div class="wallpaper-builder">
    <div class="builder-layout">
      <!-- Canvas Preview -->
      <div class="preview-section">
        <div class="preview-header">
          <h3>Preview</h3>
          <div class="device-selector">
            <select v-model="settings.deviceType" @change="updateCanvasSize">
              <option v-for="(preset, key) in devicePresets" :key="key" :value="key">
                {{ preset.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="canvas-container" ref="canvasContainer">
          <canvas 
            ref="canvasRef" 
            :style="canvasStyle"
            class="wallpaper-canvas"
          ></canvas>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="controls-section">
        <div class="controls-scroll">
          <!-- Background Section -->
          <div class="control-group">
            <h4>Background</h4>
            
            <div class="background-options">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="settings.backgroundType" 
                  value="preset"
                />
                <span>Preset</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="settings.backgroundType" 
                  value="upload"
                />
                <span>Upload</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="settings.backgroundType" 
                  value="color"
                />
                <span>Solid Color</span>
              </label>
            </div>
            
            <!-- Preset Backgrounds -->
            <div v-if="settings.backgroundType === 'preset'" class="preset-backgrounds">
              <div v-if="presetBackgrounds.length === 0" class="no-presets">
                <p>No preset backgrounds available yet.</p>
                <p>Please use "Upload" or "Solid Color" options.</p>
              </div>
              <div 
                v-else
                v-for="bg in presetBackgrounds" 
                :key="bg.path"
                class="preset-thumb"
                :class="{ active: settings.backgroundImage === bg.path }"
                @click="setPresetBackground(bg.path)"
              >
                <img :src="bg.thumb || bg.path" :alt="bg.name" />
                <span>{{ bg.name }}</span>
              </div>
            </div>
            
            <!-- Upload -->
            <div v-if="settings.backgroundType === 'upload'" class="upload-section">
              <input 
                type="file" 
                accept="image/*" 
                @change="handleFileUpload"
                ref="fileInput"
              />
              <BaseButton 
                variant="secondary" 
                size="sm"
                @click="$refs.fileInput.click()"
              >
                Choose Image
              </BaseButton>
            </div>
            
            <!-- Color Picker -->
            <div v-if="settings.backgroundType === 'color'" class="color-section">
              <label>
                Background Color
                <input 
                  type="color" 
                  v-model="settings.backgroundColor"
                />
              </label>
            </div>
            
            <!-- Background Controls -->
            <div v-if="settings.backgroundType !== 'color' && settings.backgroundImage" class="background-controls">
              <label>
                Scale
                <input 
                  type="range" 
                  v-model.number="settings.backgroundScale"
                  min="0.5" 
                  max="2" 
                  step="0.1"
                />
                <span>{{ settings.backgroundScale }}x</span>
              </label>
              
              <label>
                Position X
                <input 
                  type="range" 
                  v-model.number="settings.backgroundPosition.x"
                  min="0" 
                  max="100" 
                  step="1"
                />
                <span>{{ settings.backgroundPosition.x }}%</span>
              </label>
              
              <label>
                Position Y
                <input 
                  type="range" 
                  v-model.number="settings.backgroundPosition.y"
                  min="0" 
                  max="100" 
                  step="1"
                />
                <span>{{ settings.backgroundPosition.y }}%</span>
              </label>
              
              <label>
                Opacity
                <input 
                  type="range" 
                  v-model.number="settings.backgroundOpacity"
                  min="0" 
                  max="1" 
                  step="0.1"
                />
                <span>{{ Math.round(settings.backgroundOpacity * 100) }}%</span>
              </label>
            </div>
          </div>
          
          <!-- Text Content Section -->
          <div class="control-group">
            <h4>Text Content</h4>
            
            <label>
              Line 1 (Top Text)
              <input 
                type="text" 
                v-model="settings.line2Text"
                placeholder="THIS GADGET BELONGS TO"
                class="text-input"
              />
            </label>
            
            <label>
              Line 2 (Name/Playa Name)
              <input 
                type="text" 
                v-model="settings.line1Text"
                placeholder="ABBY / BOOTTY"
                class="text-input"
              />
            </label>
            
            <label>
              Camp Name
              <input 
                type="text" 
                v-model="settings.campName"
                :placeholder="campData?.name || 'OKNOTOK'"
                class="text-input"
              />
            </label>
            
            <label>
              Camp Location
              <input 
                type="text" 
                v-model="settings.campLocation"
                :placeholder="campData?.location || '3:30 & A'"
                class="text-input"
              />
            </label>
          </div>
          
          <!-- Text Style Section -->
          <div class="control-group">
            <h4>Text Style</h4>
            
            <label>
              Text Color
              <input 
                type="color" 
                v-model="settings.textColor"
              />
            </label>
            
            <label>
              Font
              <select v-model="settings.fontFamily">
                <option value="Berkeley Mono, monospace">Berkeley Mono</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="Courier New, monospace">Courier New</option>
              </select>
            </label>
            
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="settings.textShadow"
              />
              Text Shadow
            </label>
            
            <div v-if="settings.textShadow">
              <label>
                Shadow Color
                <input 
                  type="text" 
                  v-model="settings.textShadowColor"
                  placeholder="rgba(0, 0, 0, 0.8)"
                />
              </label>
            </div>
            
            <label>
              Text Alignment
              <select v-model="settings.textAlign">
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
          
          <!-- Text Sizes Section -->
          <div class="control-group">
            <h4>Text Sizes</h4>
            
            <label>
              Camp Name Size
              <input 
                type="range" 
                v-model.number="settings.campNameSize"
                min="0.04" 
                max="0.12" 
                step="0.005"
              />
              <span>{{ Math.round(settings.campNameSize * 1000) / 10 }}%</span>
            </label>
            
            <label>
              Location Size
              <input 
                type="range" 
                v-model.number="settings.campLocationSize"
                min="0.03" 
                max="0.10" 
                step="0.005"
              />
              <span>{{ Math.round(settings.campLocationSize * 1000) / 10 }}%</span>
            </label>
            
            <label>
              Name Size
              <input 
                type="range" 
                v-model.number="settings.line1Size"
                min="0.03" 
                max="0.08" 
                step="0.005"
              />
              <span>{{ Math.round(settings.line1Size * 1000) / 10 }}%</span>
            </label>
            
            <label>
              Other Text Size
              <input 
                type="range" 
                v-model.number="settings.line2Size"
                min="0.02" 
                max="0.06" 
                step="0.005"
              />
              <span>{{ Math.round(settings.line2Size * 1000) / 10 }}%</span>
            </label>
          </div>
          
          <!-- Layout Section -->
          <div class="control-group">
            <h4>Layout</h4>
            
            <label>
              Top Margin
              <input 
                type="range" 
                v-model.number="settings.topMargin"
                min="0.15" 
                max="0.45" 
                step="0.01"
              />
              <span>{{ Math.round(settings.topMargin * 100) }}%</span>
            </label>
            
            <label>
              Text Spacing
              <input 
                type="range" 
                v-model.number="settings.textSpacing"
                min="0.01" 
                max="0.05" 
                step="0.005"
              />
              <span>{{ Math.round(settings.textSpacing * 1000) / 10 }}%</span>
            </label>
          </div>
          
          <!-- Export Section -->
          <div class="control-group export-group">
            <h4>Export</h4>
            
            <BaseButton 
              variant="primary" 
              size="lg"
              fullWidth
              @click="exportWallpaper"
            >
              Download Wallpaper
            </BaseButton>
            
            <div class="export-info">
              <p>Size: {{ settings.width }} × {{ settings.height }}px</p>
              <p>Format: PNG</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useWallpaperCanvas } from '@/composables/useWallpaperCanvas'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  campData: {
    type: Object,
    default: () => ({})
  },
  memberName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

// Canvas setup
const canvasRef = ref(null)
const canvasContainer = ref(null)
const {
  settings,
  devicePresets,
  initCanvas,
  renderWallpaper,
  exportWallpaper: exportCanvas,
  handleBackgroundUpload,
  setPresetBackground,
  updateCanvasSize
} = useWallpaperCanvas()

// Preset backgrounds - these will be populated when you add images
// For now, starting with an empty array or sample gradients
const presetBackgrounds = ref([
  // Uncomment these when you add the actual images:
  // { 
  //   name: 'Cosmic', 
  //   path: '/wallpapers/backgrounds/cosmic.jpg',
  //   thumb: '/wallpapers/backgrounds/cosmic-thumb.jpg'
  // },
  // { 
  //   name: 'Desert', 
  //   path: '/wallpapers/backgrounds/desert.jpg',
  //   thumb: '/wallpapers/backgrounds/desert-thumb.jpg'
  // },
  // { 
  //   name: 'Playa', 
  //   path: '/wallpapers/backgrounds/playa.jpg',
  //   thumb: '/wallpapers/backgrounds/playa-thumb.jpg'
  // },
  // { 
  //   name: 'Stars', 
  //   path: '/wallpapers/backgrounds/stars.jpg',
  //   thumb: '/wallpapers/backgrounds/stars-thumb.jpg'
  // },
  // { 
  //   name: 'Abstract', 
  //   path: '/wallpapers/backgrounds/abstract.jpg',
  //   thumb: '/wallpapers/backgrounds/abstract-thumb.jpg'
  // }
])

// Canvas style for responsive display
const canvasStyle = computed(() => {
  const containerWidth = canvasContainer.value?.clientWidth || 400
  const containerHeight = canvasContainer.value?.clientHeight || 800
  
  const canvasAspect = settings.value.width / settings.value.height
  const containerAspect = containerWidth / containerHeight
  
  let width, height
  if (canvasAspect > containerAspect) {
    // Canvas is wider
    width = containerWidth
    height = containerWidth / canvasAspect
  } else {
    // Canvas is taller
    height = containerHeight
    width = containerHeight * canvasAspect
  }
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: '100%',
    maxHeight: '100%'
  }
})

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    handleBackgroundUpload(file)
  }
}

// Export wallpaper with custom filename
const exportWallpaper = () => {
  const campName = settings.value.campName.replace(/\s+/g, '-')
  const memberName = settings.value.line1Text.replace(/\s+/g, '-')
  const year = new Date().getFullYear()
  const filename = `${campName}-${year}-${memberName}.png`
  
  exportCanvas(filename)
}

// Initialize with camp data
onMounted(() => {
  if (props.campData) {
    settings.value.campName = props.campData.name || 'OKNOTOK'
    settings.value.campLocation = props.campData.location || '3:30 & A'
  }
  
  if (props.memberName) {
    settings.value.line1Text = props.memberName
  }
  
  // Initialize canvas
  if (canvasRef.value) {
    initCanvas(canvasRef.value)
  }
})

// Watch for canvas ref changes
watch(canvasRef, (newCanvas) => {
  if (newCanvas) {
    initCanvas(newCanvas)
  }
})
</script>

<style scoped>
.wallpaper-builder {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-base);
}

.builder-layout {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
}

/* Preview Section */
.preview-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border-light);
}

.preview-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.device-selector select {
  padding: 5px 10px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 20px;
  overflow: hidden;
}

.wallpaper-canvas {
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Controls Section */
.controls-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated);
  border-radius: 8px;
  overflow: hidden;
}

.controls-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.control-group {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.control-group:last-child {
  border-bottom: none;
}

.control-group h4 {
  margin: 0 0 15px 0;
  color: var(--color-text-primary);
  font-size: 1.1em;
}

/* Form Controls */
label {
  display: block;
  margin-bottom: 10px;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.text-input,
select {
  width: 100%;
  padding: 8px;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  margin-top: 5px;
}

input[type="color"] {
  width: 50px;
  height: 30px;
  border: 1px solid var(--color-border-medium);
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

input[type="range"] {
  width: 100%;
  margin: 5px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox-label input {
  width: auto;
  margin: 0;
}

/* Background Options */
.background-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.radio-option input {
  margin: 0;
}

.preset-backgrounds {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
}

.no-presets {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  background: var(--color-bg-base);
  border-radius: 4px;
  color: var(--color-text-muted);
}

.no-presets p {
  margin: 5px 0;
  font-size: 0.9em;
}

.preset-thumb {
  cursor: pointer;
  text-align: center;
  padding: 5px;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: all 0.2s;
}

.preset-thumb:hover {
  background: var(--color-bg-hover);
}

.preset-thumb.active {
  border-color: var(--color-primary);
  background: var(--color-bg-active);
}

.preset-thumb img {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 2px;
}

.preset-thumb span {
  display: block;
  margin-top: 5px;
  font-size: 0.8em;
  color: var(--color-text-secondary);
}

.upload-section {
  margin-top: 15px;
}

.upload-section input[type="file"] {
  display: none;
}

.color-section label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.background-controls label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.background-controls span {
  min-width: 50px;
  text-align: right;
  color: var(--color-text-muted);
  font-size: 0.9em;
}

/* Export Section */
.export-group {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.export-info {
  margin-top: 15px;
  padding: 10px;
  background: var(--color-bg-base);
  border-radius: 4px;
  text-align: center;
}

.export-info p {
  margin: 5px 0;
  color: var(--color-text-muted);
  font-size: 0.9em;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .builder-layout {
    flex-direction: column;
    padding: 10px;
  }
  
  .controls-section {
    width: 100%;
    max-height: 50vh;
  }
  
  .preset-backgrounds {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>