<template>
  <div class="kitchen-section">
    <div class="section-card">
      <div class="section-header clickable" @click="toggleCollapse">
        <div class="header-with-arrow">
          <span class="disclosure-arrow" :class="{ rotated: isCollapsed }">▼</span>
          <h3>Kitchen & Meals</h3>
        </div>
        <BaseButton 
          v-show="!isCollapsed"
          variant="secondary" 
          size="sm"
          @click.stop="addMealPlan"
        >
          + Add Meal
        </BaseButton>
      </div>
      
      <div v-show="!isCollapsed" class="kitchen-content">
        <!-- Kitchen Overview -->
        <div class="kitchen-overview">
          <div class="overview-stats">
            <div class="stat-card">
              <div class="stat-number">{{ teamMembers.length }}</div>
              <div class="stat-label">Team Members</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ mealPlans.length }}</div>
              <div class="stat-label">Planned Meals</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ uniqueDietaryRestrictions.length }}</div>
              <div class="stat-label">Dietary Needs</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ equipmentList.length }}</div>
              <div class="stat-label">Equipment Items</div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.icon }} {{ tab.name }}
          </button>
        </div>

        <!-- Meal Planning Tab -->
        <div v-if="activeTab === 'meals'" class="tab-content">
          <div class="meal-planning">
            <div v-if="mealPlans.length === 0" class="no-meals">
              <div class="no-meals-content">
                <div class="no-meals-icon">🍽️</div>
                <h4>No meals planned yet</h4>
                <p>Start by adding your first meal plan</p>
                <BaseButton variant="primary" @click="addMealPlan">Add First Meal</BaseButton>
              </div>
            </div>

            <div v-else class="meals-grid">
              <div 
                v-for="meal in mealPlans"
                :key="meal.id"
                class="meal-card"
              >
                <div class="meal-header">
                  <div class="meal-info">
                    <h4>{{ meal.name }}</h4>
                    <div class="meal-meta">
                      {{ formatMealTime(meal.date, meal.meal_type) }} • 
                      Serves {{ meal.servings }} • 
                      Cook: {{ getMemberName(meal.cook_id) || 'Unassigned' }}
                    </div>
                  </div>
                  <div class="meal-actions">
                    <BaseButton variant="ghost" size="sm" @click="editMeal(meal)">Edit</BaseButton>
                    <BaseButton variant="danger" size="sm" @click="deleteMeal(meal.id)">Delete</BaseButton>
                  </div>
                </div>

                <div class="meal-content">
                  <div v-if="meal.description" class="meal-description">
                    {{ meal.description }}
                  </div>
                  
                  <div v-if="meal.ingredients && meal.ingredients.length > 0" class="meal-ingredients">
                    <h5>Ingredients:</h5>
                    <ul>
                      <li v-for="ingredient in meal.ingredients" :key="ingredient">
                        {{ ingredient }}
                      </li>
                    </ul>
                  </div>

                  <div class="meal-dietary">
                    <span 
                      v-for="diet in meal.dietary_accommodations"
                      :key="diet"
                      class="dietary-tag"
                    >
                      {{ diet }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dietary Restrictions Tab -->
        <div v-if="activeTab === 'dietary'" class="tab-content">
          <div class="dietary-tracker">
            <div class="dietary-summary">
              <h4>Team Dietary Summary</h4>
              <div class="dietary-stats">
                <div 
                  v-for="restriction in uniqueDietaryRestrictions"
                  :key="restriction"
                  class="dietary-stat"
                >
                  <span class="dietary-name">{{ restriction }}</span>
                  <span class="dietary-count">{{ countDietaryRestriction(restriction) }} member{{ countDietaryRestriction(restriction) !== 1 ? 's' : '' }}</span>
                </div>
                <div v-if="uniqueDietaryRestrictions.length === 0" class="no-dietary">
                  No specific dietary restrictions recorded
                </div>
              </div>
            </div>

            <div class="member-dietary-details">
              <h4>Individual Details</h4>
              <div class="member-dietary-list">
                <div 
                  v-for="member in teamMembers"
                  :key="member.id"
                  class="member-dietary-item"
                >
                  <div class="member-info">
                    <div class="member-name">{{ member.first_name }} {{ member.last_name }}</div>
                    <div class="member-dietary">
                      {{ member.dietary_restrictions || 'No restrictions' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment Tab -->
        <div v-if="activeTab === 'equipment'" class="tab-content">
          <div class="equipment-manager">
            <div class="equipment-controls">
              <BaseButton variant="secondary" @click="addEquipment">+ Add Equipment</BaseButton>
            </div>

            <div v-if="equipmentList.length === 0" class="no-equipment">
              <div class="no-equipment-content">
                <div class="no-equipment-icon">🔧</div>
                <h4>No equipment tracked yet</h4>
                <p>Add kitchen equipment and tools to track what's available</p>
              </div>
            </div>

            <div v-else class="equipment-grid">
              <div 
                v-for="equipment in equipmentList"
                :key="equipment.id"
                class="equipment-card"
              >
                <div class="equipment-header">
                  <h5>{{ equipment.name }}</h5>
                  <BaseButton variant="danger" size="sm" @click="deleteEquipment(equipment.id)">
                    Delete
                  </BaseButton>
                </div>
                <div class="equipment-details">
                  <div class="equipment-quantity">Quantity: {{ equipment.quantity || 1 }}</div>
                  <div v-if="equipment.owner" class="equipment-owner">Owner: {{ equipment.owner }}</div>
                  <div v-if="equipment.notes" class="equipment-notes">{{ equipment.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Meal Editor Modal -->
    <div v-if="showMealEditor" class="modal-overlay" @click="closeMealEditor">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingMeal?.id ? 'Edit Meal' : 'Add New Meal' }}</h3>
          <BaseButton variant="ghost" @click="closeMealEditor">×</BaseButton>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>Meal Name *</label>
              <input 
                type="text" 
                v-model="editingMeal.name"
                class="form-input"
                placeholder="Pasta with marinara"
                required
              />
            </div>

            <div class="form-field">
              <label>Date *</label>
              <input 
                type="date" 
                v-model="editingMeal.date"
                class="form-input"
                required
              />
            </div>

            <div class="form-field">
              <label>Meal Type *</label>
              <select v-model="editingMeal.meal_type" class="form-select" required>
                <option value="">Select...</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div class="form-field">
              <label>Servings *</label>
              <input 
                type="number" 
                v-model.number="editingMeal.servings"
                class="form-input"
                min="1"
                required
              />
            </div>

            <div class="form-field">
              <label>Cook</label>
              <select v-model="editingMeal.cook_id" class="form-select">
                <option value="">Unassigned</option>
                <option 
                  v-for="member in teamMembers"
                  :key="member.id"
                  :value="member.id"
                >
                  {{ member.first_name }} {{ member.last_name }}
                </option>
              </select>
            </div>

            <div class="form-field full-width">
              <label>Description</label>
              <textarea 
                v-model="editingMeal.description"
                class="form-textarea"
                rows="2"
                placeholder="Meal description..."
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label>Ingredients (one per line)</label>
              <textarea 
                v-model="ingredientsText"
                class="form-textarea"
                rows="4"
                placeholder="2 lbs pasta&#10;1 jar marinara sauce&#10;1 lb ground beef"
              ></textarea>
            </div>

            <div class="form-field full-width">
              <label>Dietary Accommodations</label>
              <div class="checkbox-group">
                <label v-for="diet in dietaryOptions" :key="diet" class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="diet"
                    v-model="editingMeal.dietary_accommodations"
                    class="form-checkbox"
                  />
                  {{ diet }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <BaseButton variant="ghost" @click="closeMealEditor">Cancel</BaseButton>
          <BaseButton 
            variant="primary" 
            @click="saveMeal"
            :disabled="!editingMeal?.name || !editingMeal?.date || !editingMeal?.meal_type"
          >
            {{ editingMeal?.id ? 'Save Changes' : 'Add Meal' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '../ui/BaseButton.vue'

// Props
const props = defineProps({
  teamMembers: {
    type: Array,
    default: () => []
  },
  kitchenData: {
    type: Object,
    default: () => ({
      meal_plans: [],
      equipment: []
    })
  }
})

// Emits
const emit = defineEmits(['update:kitchenData'])

// Local state
const isCollapsed = ref(true)
const storageKey = 'campEditorKitchenCollapsed'
const activeTab = ref('meals')
const showMealEditor = ref(false)
const editingMeal = ref(null)
const ingredientsText = ref('')

// Reactive data
const mealPlans = ref(props.kitchenData?.meal_plans || [])
const equipmentList = ref(props.kitchenData?.equipment || [])

// Tab configuration
const tabs = [
  { id: 'meals', name: 'Meals', icon: '🍽️' },
  { id: 'dietary', name: 'Dietary', icon: '🥗' },
  { id: 'equipment', name: 'Equipment', icon: '🔧' }
]

// Dietary options
const dietaryOptions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Keto', 'Paleo', 'Nut-Free', 'Kosher', 'Halal'
]

// Computed properties
const uniqueDietaryRestrictions = computed(() => {
  const restrictions = new Set()
  props.teamMembers.forEach(member => {
    if (member.dietary_restrictions && member.dietary_restrictions.trim() !== '') {
      // Split by common delimiters and clean up
      const memberRestrictions = member.dietary_restrictions
        .split(/[,;]/)
        .map(r => r.trim())
        .filter(r => r.length > 0)
      
      memberRestrictions.forEach(r => restrictions.add(r))
    }
  })
  return Array.from(restrictions).sort()
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem(storageKey, isCollapsed.value.toString())
}

const formatMealTime = (date, mealType) => {
  if (!date) return 'Date TBD'
  
  const mealDate = new Date(date)
  const dateStr = mealDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  
  const mealTypeFormatted = mealType.charAt(0).toUpperCase() + mealType.slice(1)
  return `${dateStr} ${mealTypeFormatted}`
}

const getMemberName = (memberId) => {
  if (!memberId) return null
  const member = props.teamMembers.find(m => m.id === memberId)
  return member ? `${member.first_name} ${member.last_name}` : null
}

const countDietaryRestriction = (restriction) => {
  return props.teamMembers.filter(member => 
    member.dietary_restrictions && 
    member.dietary_restrictions.toLowerCase().includes(restriction.toLowerCase())
  ).length
}

const addMealPlan = () => {
  editingMeal.value = {
    id: null,
    name: '',
    date: '',
    meal_type: '',
    servings: props.teamMembers.length || 8,
    cook_id: null,
    description: '',
    ingredients: [],
    dietary_accommodations: []
  }
  ingredientsText.value = ''
  showMealEditor.value = true
}

const editMeal = (meal) => {
  editingMeal.value = { ...meal }
  ingredientsText.value = meal.ingredients ? meal.ingredients.join('\n') : ''
  showMealEditor.value = true
}

const closeMealEditor = () => {
  showMealEditor.value = false
  editingMeal.value = null
  ingredientsText.value = ''
}

const saveMeal = () => {
  if (!editingMeal.value?.name || !editingMeal.value?.date || !editingMeal.value?.meal_type) {
    return
  }
  
  // Process ingredients
  const ingredients = ingredientsText.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  editingMeal.value.ingredients = ingredients
  
  if (editingMeal.value.id) {
    // Update existing meal
    const index = mealPlans.value.findIndex(m => m.id === editingMeal.value.id)
    if (index !== -1) {
      mealPlans.value[index] = { ...editingMeal.value }
    }
  } else {
    // Add new meal
    editingMeal.value.id = `meal_${Date.now()}`
    mealPlans.value.push({ ...editingMeal.value })
  }
  
  // Sort meals by date and meal type
  mealPlans.value.sort((a, b) => {
    const dateCompare = new Date(a.date) - new Date(b.date)
    if (dateCompare !== 0) return dateCompare
    
    const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 }
    return (mealOrder[a.meal_type] || 5) - (mealOrder[b.meal_type] || 5)
  })
  
  emit('update:kitchenData', {
    ...props.kitchenData,
    meal_plans: [...mealPlans.value]
  })
  
  closeMealEditor()
}

const deleteMeal = (mealId) => {
  const meal = mealPlans.value.find(m => m.id === mealId)
  const confirmed = confirm(`Delete meal plan for "${meal?.name}"?`)
  
  if (confirmed) {
    mealPlans.value = mealPlans.value.filter(m => m.id !== mealId)
    emit('update:kitchenData', {
      ...props.kitchenData,
      meal_plans: [...mealPlans.value]
    })
  }
}

const addEquipment = () => {
  const name = prompt('Equipment name:')
  if (name && name.trim()) {
    const quantity = prompt('Quantity:', '1')
    const owner = prompt('Owner (optional):')
    
    const newEquipment = {
      id: `equipment_${Date.now()}`,
      name: name.trim(),
      quantity: parseInt(quantity) || 1,
      owner: owner?.trim() || '',
      notes: ''
    }
    
    equipmentList.value.push(newEquipment)
    emit('update:kitchenData', {
      ...props.kitchenData,
      equipment: [...equipmentList.value]
    })
  }
}

const deleteEquipment = (equipmentId) => {
  const equipment = equipmentList.value.find(e => e.id === equipmentId)
  const confirmed = confirm(`Delete "${equipment?.name}" from equipment list?`)
  
  if (confirmed) {
    equipmentList.value = equipmentList.value.filter(e => e.id !== equipmentId)
    emit('update:kitchenData', {
      ...props.kitchenData,
      equipment: [...equipmentList.value]
    })
  }
}

// Load collapse state on mount
onMounted(() => {
  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    isCollapsed.value = saved === 'true'
  }
})
</script>

<style scoped>
/* Section card */
.section-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 6px;
  padding: 1.5rem;
  height: fit-content;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  min-height: 2.5rem;
}

.section-header.clickable {
  cursor: pointer;
  margin-bottom: 0;
}

.section-header.clickable:hover h3 {
  color: var(--color-primary);
}

.header-with-arrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.disclosure-arrow {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  user-select: none;
}

.disclosure-arrow.rotated {
  transform: rotate(-90deg);
}

.section-card h3 {
  color: var(--color-accent);
  margin: 0;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}

.kitchen-content {
  margin-top: 1.5rem;
}

.coming-soon {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.coming-soon h4 {
  color: var(--color-accent);
  margin-bottom: 1rem;
}

.coming-soon ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.coming-soon li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border-light);
}

.coming-soon li:last-child {
  border-bottom: none;
}
</style>