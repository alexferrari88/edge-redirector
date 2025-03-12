document.addEventListener('DOMContentLoaded', async () => {
  // Get references to DOM elements
  const extensionToggle = document.getElementById('extensionToggle');
  const statusText = document.getElementById('statusText');
  const domainList = document.getElementById('domainList');
  const addDomainForm = document.getElementById('addDomainForm');
  const newDomainInput = document.getElementById('newDomain');
  const openOptionsBtn = document.getElementById('openOptions');
  
  // Fetch current settings
  const settings = await getSettings();
  
  // Update the UI with current settings
  updateUI(settings);
  
  // Event listeners
  extensionToggle.addEventListener('change', async () => {
    const response = await sendMessage({ action: 'toggleEnabled' });
    if (response.success) {
      const updatedSettings = await getSettings();
      updateUI(updatedSettings);
    }
  });
  
  addDomainForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const domain = newDomainInput.value.trim();
    if (!domain) return;
    
    // Basic validation
    if (!isValidDomain(domain)) {
      alert('Please enter a valid domain (e.g., example.com or *.example.com)');
      return;
    }
    
    // Check for duplicates
    if (settings.domains.includes(domain)) {
      alert('This domain is already in your list.');
      return;
    }
    
    // Add the new domain
    settings.domains.push(domain);
    
    // Save the updated settings
    const response = await sendMessage({
      action: 'saveSettings',
      settings: settings
    });
    
    if (response.success) {
      newDomainInput.value = '';
      updateUI(settings);
    }
  });
  
  openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Function to render the domain list
  function renderDomainList(domains) {
    domainList.innerHTML = '';
    
    if (domains.length === 0) {
      domainList.innerHTML = '<p style="text-align: center; color: #666;">No domains added yet</p>';
      return;
    }
    
    domains.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'domain-item';
      
      const domainText = document.createElement('span');
      domainText.className = 'domain-text';
      domainText.textContent = domain;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', async () => {
        const updatedDomains = settings.domains.filter(d => d !== domain);
        settings.domains = updatedDomains;
        
        const response = await sendMessage({
          action: 'saveSettings',
          settings: settings
        });
        
        if (response.success) {
          updateUI(settings);
        }
      });
      
      item.appendChild(domainText);
      item.appendChild(removeBtn);
      domainList.appendChild(item);
    });
  }
  
  // Function to update the UI based on settings
  function updateUI(settings) {
    extensionToggle.checked = settings.enabled;
    
    if (settings.enabled) {
      statusText.textContent = 'Extension is active';
      statusText.className = 'status active';
    } else {
      statusText.textContent = 'Extension is disabled';
      statusText.className = 'status inactive';
    }
    
    renderDomainList(settings.domains);
  }
  
  // Helper function to send messages to background script
  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || {});
      });
    });
  }
  
  // Helper function to get settings from background script
  function getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        resolve(response || { enabled: false, domains: [] });
      });
    });
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
});
