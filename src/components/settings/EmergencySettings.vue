<template>
  <div class="tab-content emergency-content">
    <h2>Emergency Information</h2>
    
    <div class="settings-section emergency-info">
      <h3>🚨 Emergency Numbers</h3>
      <div class="emergency-grid">
        <div class="emergency-item">
          <h4>Life-Threatening Emergency</h4>
          <a href="tel:911" class="emergency-tel">911</a>
          <p>For immediate medical or safety emergencies on playa</p>
        </div>
        <div class="emergency-item">
          <h4>Black Rock Rangers</h4>
          <p class="ranger-locations">Ranger Outposts at 3:00, 6:00, 9:00 Plazas</p>
          <p>For non-emergency assistance and support</p>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="emergency-tabs">
        <BaseButton 
          @click="emergencyTab = 'contacts'" 
          variant="ghost"
          :active="emergencyTab === 'contacts'"
          class="btn-tab"
        >
          Personal Contacts
        </BaseButton>
        <BaseButton 
          @click="emergencyTab = 'medical'" 
          variant="ghost"
          :active="emergencyTab === 'medical'"
          class="btn-tab"
        >
          Medical Info
        </BaseButton>
        <BaseButton 
          @click="emergencyTab = 'resources'" 
          variant="ghost"
          :active="emergencyTab === 'resources'"
          class="btn-tab"
        >
          Resources
        </BaseButton>
      </div>

      <!-- Emergency Contacts Tab -->
      <div v-if="emergencyTab === 'contacts'" class="tab-content-section">
        <h4>Your Emergency Contacts</h4>
        
        <div v-if="contacts.length === 0" class="empty-state">
          <p>No emergency contacts added yet.</p>
          <p class="hint">Add contacts who should be notified in case of emergency.</p>
        </div>
        
        <div v-else class="contacts-grid">
          <div v-for="contact in contacts" :key="contact.id" class="contact-card">
            <div class="contact-header">
              <strong>{{ contact.name }}</strong>
              <BaseButton @click="removeContact(contact.id)" variant="ghost" size="sm" title="Remove contact">×</BaseButton>
            </div>
            <div class="contact-details">
              <span class="relationship">{{ contact.relationship }}</span>
              <div class="contact-phone">📞 {{ contact.phone }}</div>
              <div v-if="contact.notes" class="contact-notes">{{ contact.notes }}</div>
            </div>
          </div>
        </div>
        
        <BaseButton @click="showAddContact = !showAddContact" :variant="showAddContact ? 'secondary' : 'primary'">
          {{ showAddContact ? 'Cancel' : '+ Add Contact' }}
        </BaseButton>

        <form v-if="showAddContact" @submit.prevent="addContact" class="contact-form">
          <div class="form-group">
            <label for="contact-name">Name *</label>
            <input 
              id="contact-name" 
              v-model="newContact.name" 
              type="text" 
              required 
              class="form-input"
              placeholder="Full name"
            >
          </div>
          
          <div class="form-group">
            <label for="contact-relationship">Relationship</label>
            <input 
              id="contact-relationship" 
              v-model="newContact.relationship" 
              type="text" 
              class="form-input"
              placeholder="e.g., Spouse, Parent, Friend"
            >
          </div>
          
          <div class="form-group">
            <label for="contact-phone">Phone Number *</label>
            <input 
              id="contact-phone" 
              v-model="newContact.phone" 
              type="tel" 
              required 
              class="form-input"
              placeholder="Include country code if international"
            >
          </div>
          
          <div class="form-group">
            <label for="contact-notes">Notes</label>
            <textarea 
              id="contact-notes" 
              v-model="newContact.notes" 
              class="form-textarea"
              placeholder="Any special instructions or notes"
              rows="3"
            ></textarea>
          </div>
          
          <BaseButton type="submit" variant="primary">Add Contact</BaseButton>
        </form>
      </div>

      <!-- Medical Info Tab -->
      <div v-if="emergencyTab === 'medical'" class="tab-content-section">
        <h4>Medical Information</h4>
        <div class="info-box">
          <p>This information stays private on your device and can help first responders.</p>
        </div>

        <form @submit.prevent="saveMedicalInfo" class="medical-form">
          <div class="form-group">
            <label for="blood-type">Blood Type</label>
            <input 
              id="blood-type" 
              v-model="medicalInfo.bloodType" 
              type="text" 
              class="form-input"
              placeholder="A+, B-, O+, etc."
            >
          </div>
          
          <div class="form-group">
            <label for="allergies">Allergies</label>
            <textarea 
              id="allergies" 
              v-model="medicalInfo.allergies" 
              class="form-textarea"
              placeholder="Food allergies, medication allergies, environmental allergies"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="medications">Current Medications</label>
            <textarea 
              id="medications" 
              v-model="medicalInfo.medications" 
              class="form-textarea"
              placeholder="List current medications and dosages"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="conditions">Medical Conditions</label>
            <textarea 
              id="conditions" 
              v-model="medicalInfo.conditions" 
              class="form-textarea"
              placeholder="Diabetes, heart conditions, etc."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label for="notes">Additional Notes</label>
            <textarea 
              id="notes" 
              v-model="medicalInfo.notes" 
              class="form-textarea"
              placeholder="Any other important medical information"
              rows="3"
            ></textarea>
          </div>
          
          <BaseButton type="submit" variant="primary">Save Medical Info</BaseButton>
        </form>
      </div>

      <!-- Resources Tab -->
      <div v-if="emergencyTab === 'resources'" class="tab-content-section">
        <h4>Emergency Resources</h4>
        
        <div class="resource-grid">
          <div class="resource-card">
            <h4>🏥 Medical Centers</h4>
            <ul>
              <li><strong>Rampart Medical</strong><br>9:00 & Esplanade</li>
              <li><strong>BRC ESD (Emergency Services)</strong><br>5:15 & Esplanade</li>
            </ul>
          </div>
          
          <div class="resource-card">
            <h4>🧠 Mental Health Support</h4>
            <ul>
              <li><strong>Zendo Project</strong><br>Psychedelic crisis support</li>
              <li><strong>Rangers</strong><br>Available 24/7 for any situation</li>
            </ul>
          </div>
        </div>
        
        <div class="resource-card safety-tips">
          <h4>🛡️ Safety Reminders</h4>
          <ul>
            <li>Drink water frequently - dehydration happens fast</li>
            <li>Protect yourself from dust storms</li>
            <li>Know your camp's location and neighbors</li>
            <li>Carry a headlamp and extra batteries</li>
            <li>Have a meeting spot if separated from friends</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { BaseButton } from '@/components/ui'

const { showToast } = useToast()

// State
const emergencyTab = ref('contacts')
const showAddContact = ref(false)

// Data
const contacts = ref([])
const medicalInfo = ref({
  bloodType: '',
  allergies: '',
  medications: '',
  conditions: '',
  notes: ''
})

// New contact form
const newContact = ref({
  name: '',
  relationship: '',
  phone: '',
  notes: ''
})

// Storage keys
const CONTACTS_KEY = 'bm_emergency_contacts'
const MEDICAL_KEY = 'bm_medical_info'

// Load emergency data from localStorage
const loadEmergencyData = () => {
  try {
    const savedContacts = localStorage.getItem(CONTACTS_KEY)
    if (savedContacts) {
      contacts.value = JSON.parse(savedContacts)
    }
    
    const savedMedical = localStorage.getItem(MEDICAL_KEY)
    if (savedMedical) {
      medicalInfo.value = { ...medicalInfo.value, ...JSON.parse(savedMedical) }
    }
  } catch (error) {
    console.error('Error loading emergency data:', error)
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
    
    // Reset form
    newContact.value = {
      name: '',
      relationship: '',
      phone: '',
      notes: ''
    }
    showAddContact.value = false
    showToast('Emergency contact added', 'success')
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

<style>
@import './settings-shared.css';
</style>

<style scoped>
/* Component-specific styles */
.emergency-info {
  border-color: var(--color-primary);
}

.emergency-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1rem;
}

.emergency-item {
  padding: 1.5rem;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
  text-align: center;
}

.emergency-item h4 {
  color: var(--color-text-primary);
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.emergency-tel {
  font-size: 2rem;
  color: var(--color-error);
  text-decoration: none;
  font-weight: bold;
  display: block;
  margin: 0.75rem 0;
  transition: color 0.2s ease;
}

.emergency-tel:hover {
  color: var(--color-error);
}

.ranger-locations {
  font-weight: 600;
  color: var(--color-primary);
  margin: 0.5rem 0;
}

.emergency-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border-medium);
  flex-wrap: wrap;
}

.tab-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text-secondary);
}

.tab-btn.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-primary);
}

.tab-content-section {
  animation: fadeIn 0.3s;
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.contact-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.contact-card:hover {
  border-color: var(--color-primary);
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.contact-header strong {
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  color: var(--color-error);
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.relationship {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 0.9rem;
}

.contact-phone {
  color: var(--color-text-secondary);
  font-family: 'Berkeley Mono', monospace;
}

.contact-notes {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-style: italic;
  margin-top: 0.25rem;
}

.contact-form, .medical-form {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.resource-card {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 1.25rem;
}

.resource-card h4 {
  color: var(--color-accent);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.resource-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.resource-card li {
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.resource-card strong {
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.safety-tips {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .emergency-grid {
    grid-template-columns: 1fr;
  }
  
  .emergency-tabs {
    gap: 0.25rem;
  }
  
  .tab-btn {
    padding: 0.75rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .contacts-grid,
  .resource-grid {
    grid-template-columns: 1fr;
  }
}
</style>