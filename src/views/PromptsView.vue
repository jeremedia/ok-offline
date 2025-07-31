<template>
  <div class="prompts-view">
    <div class="header">
      <h1>OK-OFFLINE PROMPT HISTORY</h1>
      <div class="stats">
        <span>{{ filteredPrompts.length }} prompts</span>
        <span v-if="searchQuery">matching "{{ searchQuery }}"</span>
      </div>
    </div>

    <div class="controls">
      <input 
        v-model="searchQuery"
        type="search"
        placeholder="Search prompts..."
        class="search-input"
      >
      
      <div class="actions">
        <button @click="exportJSON" class="btn">Export JSON</button>
        <button @click="exportCSV" class="btn">Export CSV</button>
      </div>
    </div>

    <div class="prompts-list">
      <div v-if="loading" class="loading">Loading prompts...</div>
      
      <div v-else-if="error" class="error">
        Error loading prompts: {{ error }}
      </div>
      
      <div v-else-if="filteredPrompts.length === 0" class="empty">
        No prompts found
      </div>
      
      <div v-else>
        <div 
          v-for="(prompt, index) in paginatedPrompts" 
          :key="index"
          class="prompt-item"
        >
          <div class="prompt-header">
            <span class="timestamp">{{ formatTimestamp(prompt.timestamp) }}</span>
            <span class="session-info">
              <span class="branch">{{ prompt.branch }}</span>
              <span class="directory">{{ formatDirectory(prompt.directory) }}</span>
            </span>
            <button @click="copyPrompt(prompt.prompt)" class="copy-btn" title="Copy prompt">
              📋
            </button>
          </div>
          <div class="prompt-content">{{ prompt.prompt }}</div>
        </div>
        
        <div v-if="totalPages > 1" class="pagination">
          <button 
            @click="currentPage--" 
            :disabled="currentPage === 1"
            class="btn"
          >
            Previous
          </button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="currentPage++" 
            :disabled="currentPage === totalPages"
            class="btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '../composables/useToast'

export default {
  name: 'PromptsView',
  setup() {
    const { showSuccess, showError } = useToast()
    
    const prompts = ref([])
    const loading = ref(true)
    const error = ref(null)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 50
    
    const filteredPrompts = computed(() => {
      if (!searchQuery.value) return prompts.value
      
      const query = searchQuery.value.toLowerCase()
      return prompts.value.filter(prompt => 
        prompt.prompt.toLowerCase().includes(query) ||
        prompt.branch.toLowerCase().includes(query) ||
        prompt.directory.toLowerCase().includes(query)
      )
    })
    
    const totalPages = computed(() => 
      Math.ceil(filteredPrompts.value.length / itemsPerPage)
    )
    
    const paginatedPrompts = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredPrompts.value.slice(start, end)
    })
    
    async function loadPrompts() {
      try {
        loading.value = true
        const response = await fetch('/data/claude-prompts.json')
        if (!response.ok) throw new Error('Failed to load prompts')
        prompts.value = await response.json()
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }
    
    function formatTimestamp(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    function formatDirectory(dir) {
      return dir.replace('/Users/jeremy/', '~/')
    }
    
    async function copyPrompt(text) {
      try {
        await navigator.clipboard.writeText(text)
        showSuccess('Prompt copied to clipboard')
      } catch (err) {
        showError('Failed to copy prompt')
      }
    }
    
    function exportJSON() {
      const data = JSON.stringify(filteredPrompts.value, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'claude-prompts.json'
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Exported prompts as JSON')
    }
    
    function exportCSV() {
      const headers = ['Timestamp', 'Prompt', 'Branch', 'Directory', 'Session']
      const rows = filteredPrompts.value.map(p => [
        p.timestamp,
        `"${p.prompt.replace(/"/g, '""')}"`,
        p.branch,
        p.directory,
        p.session
      ])
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'claude-prompts.csv'
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Exported prompts as CSV')
    }
    
    onMounted(() => {
      loadPrompts()
    })
    
    return {
      prompts,
      loading,
      error,
      searchQuery,
      currentPage,
      filteredPrompts,
      totalPages,
      paginatedPrompts,
      formatTimestamp,
      formatDirectory,
      copyPrompt,
      exportJSON,
      exportCSV
    }
  }
}
</script>

<style scoped>
.prompts-view {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  color: var(--color-accent);
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
}

.stats {
  color: var(--color-text-secondary);
  font-size: 1.2rem;
}

.controls {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 300px;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent);
  background: var(--color-bg-header);
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  background: var(--color-bg-header);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prompts-list {
  flex: 1;
  background: var(--color-bg-base);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--color-border-light);
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
}

.error {
  color: var(--color-schedule-conflict);
}

.prompt-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-elevated);
  transition: all 0.2s;
}

.prompt-item:hover {
  background: var(--color-bg-header);
  border-color: var(--color-border-heavy);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.timestamp {
  color: var(--color-accent);
  font-weight: 500;
}

.session-info {
  display: flex;
  gap: 1rem;
  flex: 1;
  margin: 0 1rem;
}

.branch {
  color: var(--color-primary);
  font-weight: 500;
}

.directory {
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem 0.5rem;
  opacity: 0.6;
  transition: all 0.2s;
  border-radius: 4px;
}

.copy-btn:hover {
  opacity: 1;
  background: var(--color-bg-input);
}

.prompt-content {
  color: var(--color-text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Berkeley Mono', monospace;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.pagination span {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .prompts-view {
    padding: 1rem;
    min-height: calc(100vh - 100px);
  }
  
  .header h1 {
    font-size: 1.5rem;
  }
  
  .controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-input {
    width: 100%;
    min-width: auto;
  }
  
  .actions {
    width: 100%;
    justify-content: center;
  }
  
  .prompts-list {
    padding: 1rem;
  }
  
  .prompt-item {
    padding: 0.75rem;
  }
  
  .prompt-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .session-info {
    flex-direction: column;
    gap: 0.25rem;
    margin: 0.5rem 0;
  }
  
  .timestamp {
    width: 100%;
  }
}
</style>