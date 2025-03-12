document.addEventListener('DOMContentLoaded', async () => {
  // Default settings
  const DEFAULT_SETTINGS = {
    enabled: true,
    domains: ["example.com"],
    redirectMethod: "protocol"
  };
  
  // DOM elements
  const extensionToggle = document.getElementById('extensionToggle');
  const statusText = document.getElementById('statusText');
  const redirectMethodSelect = document.getElementById('redirectMethod');
  const domainList = document.getElementById('domainList');
  const addDomainForm = document.getElementById('addDomainForm');
  const newDomainInput = document.getElementById('newDomain');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const lastSavedText = document.getElementById('lastSaved');
  const bulkImportBtn = document.getElementById('bulkImportBtn');
  
  // Modal elements
  const editModal = document.getElementById('editModal');
  const editDomainInput = document.getElementById('editDomainInput');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  
  const bulkModal = document.getElementById('bulkModal');
  const bulkTextarea = document.getElementById('bulkTextarea');
  const saveBulkBtn = document.getElementById('saveBulkBtn');
  const cancelBulkBtn = document.getElementById('cancelBulkBtn');
  
  // Make sure modals are hidden on page load
  hideModal(editModal);
  hideModal(bulkModal);
  
  // State
  let settings = { ...DEFAULT_SETTINGS };
  let originalSettings = { ...DEFAULT_SETTINGS };
  let currentEditDomain = '';
  let hasUnsavedChanges = false;
  
  // Initialize
  await loadSettings();
  
  // Event listeners
  extensionToggle.addEventListener('change', () => {
    settings.enabled = extensionToggle.checked;
    updateStatusText();
    markAsUnsaved();
  });
  
  redirectMethodSelect.addEventListener('change', () => {
    settings.redirectMethod = redirectMethodSelect.value;
    markAsUnsaved();
  });
  
  addDomainForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const domain = newDomainInput.value.trim();
    if (!domain) return;
    
    // Validate domain
    if (!isValidDomain(domain)) {
      alert('Please enter a valid domain (e.g., example.com or *.example.com)');
      return;
    }
    
    // Check for duplicates
    if (settings.domains.includes(domain)) {
      alert('This domain is already in your list.');
      return;
    }
    
    // Add new domain
    settings.domains.push(domain);
    newDomainInput.value = '';
    
    // Update UI
    renderDomainList();
    markAsUnsaved();
  });
  
  saveBtn.addEventListener('click', async () => {
    await saveSettings();
  });
  
  resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      settings = { ...DEFAULT_SETTINGS };
      updateUI();
      markAsUnsaved();
    }
  });
  
  bulkImportBtn.addEventListener('click', () => {
    // Populate textarea with current domains
    bulkTextarea.value = settings.domains.join('\n');
    showModal(bulkModal);
  });
  
  // Modal event listeners
  cancelEditBtn.addEventListener('click', () => {
    hideModal(editModal);
  });
  
  saveEditBtn.addEventListener('click', () => {
    const newDomain = editDomainInput.value.trim();
    
    if (!newDomain) {
      alert('Domain cannot be empty');
      return;
    }
    
    if (!isValidDomain(newDomain)) {
      alert('Please enter a valid domain');
      return;
    }
    
    // Update the domain
    const index = settings.domains.indexOf(currentEditDomain);
    if (index !== -1) {
      settings.domains[index] = newDomain;
      renderDomainList();
      markAsUnsaved();
    }
    
    hideModal(editModal);
  });
  
  cancelBulkBtn.addEventListener('click', () => {
    hideModal(bulkModal);
  });
  
  saveBulkBtn.addEventListener('click', () => {
    const lines = bulkTextarea.value.split('\n').map(line => line.trim()).filter(line => line);
    
    // Validate domains
    const invalidDomains = lines.filter(domain => !isValidDomain(domain));
    if (invalidDomains.length > 0) {
      alert(`Some domains are invalid: ${invalidDomains.join(', ')}`);
      return;
    }
    
    // Update domains
    settings.domains = lines;
    renderDomainList();
    markAsUnsaved();
    hideModal(bulkModal);
  });
  
  // Ensure event handlers on modal buttons work properly
  document.addEventListener('click', (e) => {
    if (e.target === cancelBulkBtn) {
      hideModal(bulkModal);
    }
    if (e.target === cancelEditBtn) {
      hideModal(editModal);
    }
  });
  
  // Save settings when user leaves the page if there are unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
  
  // Functions
  async function loadSettings() {
    try {
      const data = await sendMessage({ action: 'getSettings' });
      settings = { ...data };
      originalSettings = { ...data };
      updateUI();
      updateLastSaved();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  async function saveSettings() {
    try {
      const response = await sendMessage({ 
        action: 'saveSettings', 
        settings: settings 
      });
      
      if (response.success) {
        originalSettings = { ...settings };
        hasUnsavedChanges = false;
        updateLastSaved();
        saveBtn.disabled = true;
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  }
  
  function updateUI() {
    extensionToggle.checked = settings.enabled;
    updateStatusText();
    
    redirectMethodSelect.value = settings.redirectMethod;
    
    renderDomainList();
  }
  
  function updateStatusText() {
    statusText.textContent = settings.enabled ? 'Extension is active' : 'Extension is disabled';
    statusText.style.color = settings.enabled ? '#2e7d32' : '#d32f2f';
  }
  
  function renderDomainList() {
    domainList.innerHTML = '';
    
    if (settings.domains.length === 0) {
      domainList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No domains added yet</div>';
      return;
    }
    
    settings.domains.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'domain-item';
      
      const domainText = document.createElement('div');
      domainText.className = 'domain-text';
      
      // Highlight wildcard domains
      if (domain.startsWith('*.')) {
        domainText.innerHTML = '<span class="wildcard">*.</span>' + domain.substring(2);
      } else {
        domainText.textContent = domain;
      }
      
      const actions = document.createElement('div');
      actions.className = 'actions';
      
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        currentEditDomain = domain;
        editDomainInput.value = domain;
        showModal(editModal);
      });
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => {
        if (confirm(`Remove ${domain} from the redirect list?`)) {
          settings.domains = settings.domains.filter(d => d !== domain);
          renderDomainList();
          markAsUnsaved();
        }
      });
      
      actions.appendChild(editBtn);
      actions.appendChild(removeBtn);
      
      item.appendChild(domainText);
      item.appendChild(actions);
      domainList.appendChild(item);
    });
  }
  
  function markAsUnsaved() {
    hasUnsavedChanges = true;
    saveBtn.disabled = false;
  }
  
  function updateLastSaved() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    lastSavedText.textContent = `Last saved: ${timeStr}`;
  }
  
  function showModal(modal) {
    modal.classList.remove('hidden');
  }
  
  function hideModal(modal) {
    if (modal) {
      modal.classList.add('hidden');
    }
  }
  
  // Helper function to validate domain format
  function isValidDomain(domain) {
    // Allow wildcard domains (*.example.com)
    if (domain.startsWith('*.')) {
      domain = domain.substring(2);
    }
    
    // Simple domain validation regex
    const domainRegex = /^[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }
  
  // Helper function to send messages to background script
  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response || {});
        }
      });
    });
  }
});
