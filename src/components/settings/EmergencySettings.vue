<template>
  <div class="tab-content emergency-content">
    <h2>🚨 Emergency Information</h2>
    
    <div class="emergency-header">
      <div class="emergency-number">
        <h3>Burning Man Emergency</h3>
        <a href="tel:911" class="emergency-tel">911</a>
        <small>For life-threatening emergencies on playa</small>
      </div>
      
      <div class="ranger-number">
        <h3>Black Rock Rangers</h3>
        <p class="ranger-info">Visit Ranger Outposts at 3:00, 6:00, 9:00 Plazas</p>
        <small>For non-emergency assistance</small>
      </div>
    </div>
    
    <div class="emergency-subtabs">
      <button 
        @click="emergencyTab = 'contacts'" 
        :class="['subtab-btn', { active: emergencyTab === 'contacts' }]"
      >
        Emergency Contacts
      </button>
      <button 
        @click="emergencyTab = 'medical'" 
        :class="['subtab-btn', { active: emergencyTab === 'medical' }]"
      >
        Medical Info
      </button>
      <button 
        @click="emergencyTab = 'resources'" 
        :class="['subtab-btn', { active: emergencyTab === 'resources' }]"
      >
        Resources
      </button>
    </div>
    
    <!-- Emergency Contacts Tab -->
    <div v-if="emergencyTab === 'contacts'" class="subtab-content">
      <h3>Your Emergency Contacts</h3>
      
      <div v-if="contacts.length === 0" class="empty-state">
        <p>No emergency contacts added yet.</p>
        <p class="hint">Add contacts who should be notified in case of emergency.</p>
      </div>
      
      <ul v-else class="contacts-list">
        <li v-for="contact in contacts" :key="contact.id" class="contact-item">
          <div class="contact-info">
            <h4>{{ contact.name }}</h4>
            <p>{{ contact.relationship }}</p>
            <a :href="`tel:${contact.phone}`" class="contact-phone">{{ contact.phone }}</a>
            <p v-if="contact.notes" class="contact-notes">{{ contact.notes }}</p>
          </div>
          <button @click="removeContact(contact.id)" class="remove-btn">✕</button>
        </li>
      </ul>
      
      <button @click="showAddContact = !showAddContact" class="add-btn">
        {{ showAddContact ? 'Cancel' : '+ Add Contact' }}
      </button>
      
      <form v-if="showAddContact" @submit.prevent="addContact" class="add-form">
        <input 
          v-model="newContact.name" 
          placeholder="Name" 
          required
          class="form-input"
        />
        <input 
          v-model="newContact.relationship" 
          placeholder="Relationship (e.g., Spouse, Parent)" 
          required
          class="form-input"
        />
        <input 
          v-model="newContact.phone" 
          type="tel" 
          placeholder="Phone Number" 
          required
          class="form-input"
        />
        <textarea 
          v-model="newContact.notes" 
          placeholder="Additional notes (optional)"
          class="form-textarea"
        ></textarea>
        <button type="submit" class="submit-btn">Add Contact</button>
      </form>
    </div>
    
    <!-- Medical Info Tab -->
    <div v-if="emergencyTab === 'medical'" class="subtab-content">
      <h3>Your Medical Information</h3>
      
      <form @submit.prevent="saveMedicalInfo" class="medical-form">
        <div class="form-group">
          <label>Blood Type</label>
          <select v-model="medicalInfo.bloodType" class="form-select">
            <option value="">Select...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Allergies</label>
          <textarea 
            v-model="medicalInfo.allergies" 
            placeholder="List any allergies (medications, food, environmental)"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Current Medications</label>
          <textarea 
            v-model="medicalInfo.medications" 
            placeholder="List current medications and dosages"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Medical Conditions</label>
          <textarea 
            v-model="medicalInfo.conditions" 
            placeholder="List any medical conditions"
            class="form-textarea"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Emergency Notes</label>
          <textarea 
            v-model="medicalInfo.emergencyNotes" 
            placeholder="Any other important medical information"
            class="form-textarea"
          ></textarea>
        </div>
        
        <button type="submit" class="submit-btn">Save Medical Info</button>
      </form>
    </div>
    
    <!-- Resources Tab -->
    <div v-if="emergencyTab === 'resources'" class="subtab-content">
      <h3>Emergency Resources</h3>
      
      <div class="resource-section">
        <h4>Medical Stations</h4>
        <ul class="resource-list">
          <li>Center Camp Medical (5:45 & Esplanade)</li>
          <li>3:00 Medical (3:00 & C)</li>
          <li>9:00 Medical (9:00 & C)</li>
          <li>Rampart Medical (4:30 & H)</li>
        </ul>
      </div>
      
      <div class="resource-section">
        <h4>Important Radio Channels</h4>
        <ul class="resource-list">
          <li>BMIR 94.5 FM - Burning Man Information Radio</li>
          <li>Emergency Channel: Contact Rangers</li>
        </ul>
      </div>
      
      <div class="resource-section">
        <h4>Safety Tips</h4>
        <ul class="resource-list">
          <li>Stay hydrated - drink water regularly</li>
          <li>Use sunscreen and protective clothing</li>
          <li>Never travel alone at night</li>
          <li>Know your camp location and landmarks</li>
          <li>Have a meetup plan with your campmates</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'

// Toast notifications
const { showToast } = useToast()

// Storage keys
const CONTACTS_KEY = 'bm_emergency_contacts'
const MEDICAL_KEY = 'bm_medical_info'

// State
const emergencyTab = ref('contacts')
const contacts = ref([])
const showAddContact = ref(false)
const newContact = ref({
  name: '',
  relationship: '',
  phone: '',
  notes: ''
})

const medicalInfo = ref({
  bloodType: '',
  allergies: '',
  medications: '',
  conditions: '',
  emergencyNotes: ''
})

// Load emergency data from localStorage
const loadEmergencyData = () => {
  // Load contacts
  const savedContacts = localStorage.getItem(CONTACTS_KEY)
  if (savedContacts) {
    contacts.value = JSON.parse(savedContacts)
  }
  
  // Load medical info
  const savedMedical = localStorage.getItem(MEDICAL_KEY)
  if (savedMedical) {
    medicalInfo.value = JSON.parse(savedMedical)
  }
}

// Save contacts to localStorage
const saveContacts = () => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts.value))
}

// Add a new contact
const addContact = () => {
  if (newContact.value.name && newContact.value.phone) {
    contacts.value.push({
      id: Date.now(),
      ...newContact.value
    })
    saveContacts()
    showToast('Contact added successfully', 'success')
    
    newContact.value = {
      name: '',
      relationship: '',
      phone: '',
      notes: ''
    }
    showAddContact.value = false
  }
}

// Remove a contact
const removeContact = (id) => {
  contacts.value = contacts.value.filter(c => c.id !== id)
  saveContacts()
  showToast('Contact removed', 'info')
}

// Save medical information
const saveMedicalInfo = () => {
  localStorage.setItem(MEDICAL_KEY, JSON.stringify(medicalInfo.value))
  showToast('Medical information saved', 'success')
}

// Load data on mount
onMounted(() => {
  loadEmergencyData()
})
</script>

<style scoped>
.emergency-content {
  max-width: 800px;
}

.emergency-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.emergency-number, .ranger-number {
  background: #2a2a2a;
  border: 2px solid #8B0000;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.emergency-number h3, .ranger-number h3 {
  color: #fff;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.emergency-tel {
  font-size: 2rem;
  color: #ff0000;
  text-decoration: none;
  font-weight: bold;
  display: block;
  margin: 0.5rem 0;
}

.ranger-info {
  color: #ccc;
  margin: 0.5rem 0;
}

.emergency-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #444;
}

.subtab-btn {
  background: none;
  border: none;
  color: #999;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.subtab-btn:hover {
  color: #ccc;
}

.subtab-btn.active {
  color: #fff;
  border-bottom-color: #8B0000;
}

.subtab-content {
  animation: fadeIn 0.3s;
}

.contacts-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.contact-item {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.contact-info h4 {
  color: #fff;
  margin: 0 0 0.25rem 0;
}

.contact-info p {
  color: #999;
  margin: 0.25rem 0;
}

.contact-phone {
  color: #4a9eff;
  text-decoration: none;
}

.contact-notes {
  font-size: 0.9rem;
  font-style: italic;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem;
}

.remove-btn:hover {
  color: #ff6b6b;
}

.add-btn {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #8B0000;
  color: #fff;
}

.add-form, .medical-form {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.form-input, 
.form-textarea, 
.form-select {
  width: 100%;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-family: inherit;
  font-size: 1rem;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: #ccc;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.submit-btn {
  background: #8B0000;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #a00000;
}

.resource-section {
  margin-bottom: 2rem;
}

.resource-section h4 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.resource-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.resource-list li {
  color: #ccc;
  padding: 0.5rem 0;
  border-bottom: 1px solid #333;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.hint {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .emergency-header {
    grid-template-columns: 1fr;
  }
  
  .emergency-subtabs {
    flex-wrap: wrap;
  }
  
  .subtab-btn {
    flex: 1;
    min-width: 100px;
    font-size: 0.8rem;
  }
}
</style>