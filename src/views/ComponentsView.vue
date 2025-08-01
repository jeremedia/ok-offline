<template>
  <div class="components-view">
    <header class="view-header">
      <h1>UI Component Library</h1>
      <p class="subtitle">Visual testing and documentation for OK-OFFLINE components</p>
    </header>

    <div class="components-container">
      <!-- Button Components Section -->
      <section class="component-section">
        <h2>Buttons</h2>
        
        <!-- Button Variants -->
        <div class="component-group">
          <h3>Button Variants</h3>
          <div class="component-demo">
            <BaseButton variant="primary">Primary Button</BaseButton>
            <BaseButton variant="secondary">Secondary Button</BaseButton>
            <BaseButton variant="danger">Danger Button</BaseButton>
            <BaseButton variant="ghost">Ghost Button</BaseButton>
            <BaseButton variant="link">Link Button</BaseButton>
          </div>
        </div>

        <!-- Button Sizes -->
        <div class="component-group">
          <h3>Button Sizes</h3>
          <div class="component-demo">
            <BaseButton size="sm">Small</BaseButton>
            <BaseButton size="md">Medium (Default)</BaseButton>
            <BaseButton size="lg">Large</BaseButton>
          </div>
        </div>

        <!-- Button States -->
        <div class="component-group">
          <h3>Button States</h3>
          <div class="component-demo">
            <BaseButton>Normal</BaseButton>
            <BaseButton :active="true">Active</BaseButton>
            <BaseButton :disabled="true">Disabled</BaseButton>
            <BaseButton :loading="true">Loading</BaseButton>
          </div>
        </div>

        <!-- Icon Buttons -->
        <div class="component-group">
          <h3>Icon Buttons</h3>
          <div class="component-demo">
            <BaseButton variant="ghost" icon="⭐" />
            <BaseButton variant="ghost" icon="📅" />
            <BaseButton variant="ghost" icon="❤️" />
            <BaseButton variant="ghost" icon="🗺️" />
            <BaseButton variant="primary" size="sm" icon="+" />
            <BaseButton variant="danger" size="sm" icon="✕" />
          </div>
        </div>

        <!-- Button with Icons -->
        <div class="component-group">
          <h3>Buttons with Text and Icons</h3>
          <div class="component-demo">
            <BaseButton icon="⬅️" icon-position="left">Back</BaseButton>
            <BaseButton icon="➡️" icon-position="right">Next</BaseButton>
            <BaseButton variant="primary" icon="💾">Save Changes</BaseButton>
            <BaseButton variant="danger" icon="🗑️">Delete Item</BaseButton>
          </div>
        </div>

        <!-- Full Width Buttons -->
        <div class="component-group">
          <h3>Full Width Buttons</h3>
          <div class="component-demo component-demo-vertical">
            <BaseButton :full-width="true">Full Width Primary</BaseButton>
            <BaseButton variant="secondary" :full-width="true">Full Width Secondary</BaseButton>
          </div>
        </div>
      </section>

      <!-- Card Components Section -->
      <section class="component-section">
        <h2>Cards</h2>

        <!-- Basic Cards -->
        <div class="component-group">
          <h3>Card Variants</h3>
          <div class="card-grid">
            <BaseCard variant="elevated" title="Elevated Card">
              <p>This is an elevated card with a subtle shadow. Perfect for primary content.</p>
            </BaseCard>
            
            <BaseCard variant="flat" title="Flat Card">
              <p>This is a flat card with no shadow. Good for secondary content areas.</p>
            </BaseCard>
            
            <BaseCard variant="outlined" title="Outlined Card">
              <p>This is an outlined card with transparent background. Great for minimal UI.</p>
            </BaseCard>
          </div>
        </div>

        <!-- Interactive Cards -->
        <div class="component-group">
          <h3>Interactive Cards</h3>
          <div class="card-grid">
            <BaseCard 
              variant="elevated" 
              :interactive="true"
              title="Clickable Card"
              icon="🏕️"
              @click="handleCardClick"
            >
              <p>This entire card is clickable. Click to see the interaction!</p>
            </BaseCard>
            
            <BaseCard 
              variant="elevated"
              :interactive="true"
              :compact="true"
              title="Compact Interactive"
              icon="🎨"
              @click="handleCardClick"
            >
              <p>Smaller padding for dense layouts.</p>
            </BaseCard>
          </div>
        </div>

        <!-- Cards with Footer -->
        <div class="component-group">
          <h3>Cards with Actions</h3>
          <div class="card-grid">
            <BaseCard title="Event Card" icon="📅" meta="August 27, 2025">
              <p>Join us for an amazing experience at our camp. Music, art, and good vibes!</p>
              <template #actions>
                <BaseButton variant="ghost" size="sm" icon="⭐" />
                <BaseButton variant="primary" size="sm">Add to Schedule</BaseButton>
              </template>
            </BaseCard>
            
            <BaseCard variant="danger" title="Warning Card" icon="⚠️">
              <p>This action cannot be undone. Please proceed with caution.</p>
              <template #footer>
                <BaseButton variant="secondary" size="sm">Cancel</BaseButton>
                <BaseButton variant="danger" size="sm">Delete</BaseButton>
              </template>
            </BaseCard>
          </div>
        </div>

        <!-- Custom Header/Footer -->
        <div class="component-group">
          <h3>Custom Card Content</h3>
          <BaseCard>
            <template #header>
              <div class="custom-header">
                <span class="status-dot"></span>
                <h3>Custom Header Layout</h3>
                <BaseButton variant="ghost" size="sm" icon="⋮" />
              </div>
            </template>
            <p>Cards support custom header and footer content through slots.</p>
            <template #footer>
              <div class="custom-footer">
                <span>Last updated: 5 minutes ago</span>
                <a href="#" class="card-link">View Details →</a>
              </div>
            </template>
          </BaseCard>
        </div>
      </section>

      <!-- Spacing Utilities Section -->
      <section class="component-section">
        <h2>Spacing System</h2>
        
        <div class="component-group">
          <h3>Spacing Scale</h3>
          <div class="spacing-demo">
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-xs); height: var(--space-xs);"></div>
              <span>xs (4px)</span>
            </div>
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-sm); height: var(--space-sm);"></div>
              <span>sm (8px)</span>
            </div>
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-md); height: var(--space-md);"></div>
              <span>md (16px)</span>
            </div>
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-lg); height: var(--space-lg);"></div>
              <span>lg (24px)</span>
            </div>
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-xl); height: var(--space-xl);"></div>
              <span>xl (32px)</span>
            </div>
            <div class="spacing-item">
              <div class="spacing-box" style="width: var(--space-xxl); height: var(--space-xxl);"></div>
              <span>xxl (48px)</span>
            </div>
          </div>
        </div>

        <div class="component-group">
          <h3>Usage Examples</h3>
          <BaseCard>
            <pre class="code-block">
<!-- Margin utilities -->
.mt-lg  /* margin-top: 24px */
.mb-md  /* margin-bottom: 16px */
.mx-sm  /* margin-left & right: 8px */

<!-- Padding utilities -->
.p-lg   /* padding: 24px */
.py-md  /* padding-top & bottom: 16px */
.px-xl  /* padding-left & right: 32px */

<!-- Gap utilities -->
.gap-md /* gap: 16px for flex/grid */</pre>
          </BaseCard>
        </div>
      </section>

      <!-- Migration Examples Section -->
      <section class="component-section">
        <h2>Migration Examples</h2>
        
        <BaseCard title="Before & After">
          <div class="migration-example">
            <div class="migration-before">
              <h4>Before (Old Pattern)</h4>
              <pre class="code-block">
&lt;button class="favorite-btn active"&gt;⭐&lt;/button&gt;
&lt;button class="sync-button"&gt;Sync Data&lt;/button&gt;

&lt;style scoped&gt;
.favorite-btn { /* 15 lines of CSS */ }
.sync-button { /* 12 lines of CSS */ }
&lt;/style&gt;</pre>
            </div>
            
            <div class="migration-after">
              <h4>After (New Pattern)</h4>
              <pre class="code-block">
&lt;BaseButton variant="ghost" :active="true"&gt;⭐&lt;/BaseButton&gt;
&lt;BaseButton variant="primary"&gt;Sync Data&lt;/BaseButton&gt;

&lt;!-- No custom CSS needed! --&gt;</pre>
            </div>
          </div>
        </BaseCard>
      </section>
    </div>
  </div>
</template>

<script setup>
import { BaseButton, BaseCard } from '@/components/ui'
import { useToast } from '@/composables/useToast'

const { showSuccess } = useToast()

const handleCardClick = () => {
  showSuccess('Card clicked!')
}
</script>

<style scoped>
.components-view {
  min-height: 100vh;
  background: var(--color-bg-base);
  overflow-y: auto;
  padding-bottom: 4rem;
}

.view-header {
  background: var(--color-bg-header);
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border-medium);
}

.view-header h1 {
  color: var(--color-primary);
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

.subtitle {
  color: var(--color-text-muted);
  margin: 0;
}

.components-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.component-section {
  margin-bottom: 4rem;
}

.component-section h2 {
  color: var(--color-accent);
  font-size: 1.75rem;
  margin-bottom: 2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border-medium);
}

.component-group {
  margin-bottom: 2.5rem;
}

.component-group h3 {
  color: var(--color-text-primary);
  margin-bottom: 1rem;
}

.component-demo {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-medium);
  border-radius: 8px;
}

.component-demo-vertical {
  flex-direction: column;
  align-items: stretch;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Custom demo styles */
.custom-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.custom-header h3 {
  margin: 0;
  flex: 1;
}

.status-dot {
  width: 12px;
  height: 12px;
  background: var(--color-success);
  border-radius: 50%;
}

.custom-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-size: 0.875rem;
}

.card-link {
  color: var(--color-accent);
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

/* Spacing demo */
.spacing-demo {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.spacing-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.spacing-box {
  background: var(--color-primary);
  border-radius: 4px;
}

/* Code blocks */
.code-block {
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-dark);
  border-radius: 4px;
  padding: 1rem;
  font-family: 'Berkeley Mono', monospace;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  overflow-x: auto;
  margin: 0;
}

/* Migration example */
.migration-example {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.migration-before,
.migration-after {
  padding: 1rem;
  background: var(--color-bg-base);
  border-radius: 4px;
}

.migration-before h4,
.migration-after h4 {
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.migration-before {
  border: 1px solid var(--color-error);
}

.migration-after {
  border: 1px solid var(--color-success);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .components-container {
    padding: 1rem;
  }
  
  .component-demo {
    padding: 1rem;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
  
  .migration-example {
    grid-template-columns: 1fr;
  }
  
  .spacing-demo {
    gap: 1rem;
  }
}
</style>