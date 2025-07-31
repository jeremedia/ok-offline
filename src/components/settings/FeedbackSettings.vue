<template>
  <div class="tab-content feedback-content">
    <h2>Feedback & Support</h2>
    
    <div class="feedback-section">
      <h3>🐛 Report a Bug</h3>
      <p>
        Found something that's not working right? Let us know!
      </p>
      <a 
        href="https://github.com/jeremedia/ok-offline/issues/new?labels=bug&template=bug_report&title=[Bug]:%20" 
        target="_blank" 
        rel="noopener"
        class="feedback-link"
      >
        Report a Bug on GitHub →
      </a>
      
      <div class="feedback-tips">
        <p>When reporting a bug, please include:</p>
        <ul>
          <li>What you were trying to do</li>
          <li>What happened instead</li>
          <li>Your device type (phone/tablet/computer)</li>
          <li>Browser name and version</li>
          <li>Whether you were online or offline</li>
          <li>Any error messages you saw</li>
        </ul>
      </div>
    </div>

    <div class="feedback-section">
      <h3>✨ Request a Feature</h3>
      <p>
        Have an idea to make OK-OFFLINE even better? We'd love to hear it!
      </p>
      <a 
        href="https://github.com/jeremedia/ok-offline/issues/new?labels=enhancement&template=feature_request&title=[Feature]:%20" 
        target="_blank" 
        rel="noopener"
        class="feedback-link"
      >
        Request a Feature on GitHub →
      </a>
      
      <div class="feedback-tips">
        <p>When requesting a feature, consider:</p>
        <ul>
          <li>What problem it would solve</li>
          <li>How you envision it working</li>
          <li>Who would benefit from it</li>
          <li>Any examples from other apps</li>
        </ul>
      </div>
    </div>

    <div class="feedback-section">
      <h3>📋 View Existing Issues</h3>
      <p>
        Check out what others have reported or requested:
      </p>
      <a 
        href="https://github.com/jeremedia/ok-offline/issues" 
        target="_blank" 
        rel="noopener"
        class="feedback-link"
      >
        View All Issues on GitHub →
      </a>
    </div>

    <div class="feedback-section">
      <h3>💡 Contributing</h3>
      <p>
        OK-OFFLINE is open source! If you're a developer, you can contribute directly:
      </p>
      <ul>
        <li>Fork the repository</li>
        <li>Create a feature branch</li>
        <li>Make your changes</li>
        <li>Submit a pull request</li>
      </ul>
      <a 
        href="https://github.com/jeremedia/ok-offline" 
        target="_blank" 
        rel="noopener"
        class="feedback-link"
      >
        Visit the Repository →
      </a>
    </div>

    <div class="feedback-section">
      <h3>📧 Direct Contact</h3>
      <p>
        For sensitive issues or general feedback, you can also reach out directly through GitHub.
      </p>
      <p class="feedback-note">
        <strong>Note:</strong> OK-OFFLINE is a community project brought to you by Mr. OK of OKNOTOK. 
        Response times may vary, especially during the burn! 🔥
      </p>
    </div>
  </div>
</template>

<script setup>
// Feedback tab has no interactive functionality - it's purely informational
</script>

<style>
@import './settings-shared.css';
</style>

<style scoped>

/* Component-specific styles */
.feedback-link {
  display: inline-block;
  background: var(--color-primary);
  color: var(--color-text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.2s;
  margin: 0.5rem 0;
}

.feedback-link:hover {
  background: var(--color-primary-dark);
  text-decoration: none;
}

.feedback-tips {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-medium);
}

.feedback-tips p {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.feedback-note {
  background: var(--color-bg-base);
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  margin-top: 1rem;
}
</style>