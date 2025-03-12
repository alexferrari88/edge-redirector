// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  domains: ["example.com"],
  redirectMethod: "protocol" // Can be "protocol" or "native"
};

// Initialize settings on install or update
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('settings', (data) => {
    if (!data.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
});

// Function to detect OS
function detectOS() {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Win") !== -1) return "Windows";
  if (userAgent.indexOf("Mac") !== -1) return "MacOS";
  if (userAgent.indexOf("Linux") !== -1) return "Linux";
  return "Unknown";
}

// Keep track of redirects to prevent loops
const redirectTracker = {
  redirecting: new Set(),
  isBeingRedirected: function(url, tabId) {
    // Track by both URL and tabId to prevent double redirections
    const key = `${url}_${tabId}`;
    return this.redirecting.has(key);
  },
  addRedirect: function(url, tabId) {
    const key = `${url}_${tabId}`;
    this.redirecting.add(key);
    // Clear the URL from tracking after a longer delay (1000ms)
    setTimeout(() => {
      this.redirecting.delete(key);
    }, 1000);
  },
  // Check if this is one of our redirect pages (data: URLs)
  isRedirectPage: function(url) {
    return url.startsWith('data:text/html') && 
           (url.includes('Redirecting to Microsoft Edge') || 
            url.includes('Opening in Microsoft Edge') ||
            url.includes('Edge Redirection'));
  }
};

// Function to open a URL in Microsoft Edge
function openInEdge(url, tabId) {
  // Don't redirect if we're already handling this URL/tab combination or it's a redirect page
  if (redirectTracker.isBeingRedirected(url, tabId) || redirectTracker.isRedirectPage(url)) {
    return;
  }
  
  // Mark this URL/tab as being redirected to prevent loops
  redirectTracker.addRedirect(url, tabId);
  
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;
    
    // Don't redirect if extension is disabled
    if (!settings.enabled) return;
    
    const os = detectOS();
    let edgeUrl;
    
    if (settings.redirectMethod === "protocol" || os === "MacOS") {
      // Fix the Edge URL format - include the protocol in the URL
      // This is the key change to fix the navigation issue
      if (os === "Windows") {
        // For Windows, use this format
        edgeUrl = `microsoft-edge:${url}`;
      } else {
        // For macOS, use this format
        edgeUrl = `microsoft-edge://${url.replace(/^https?:\/\//, '')}`;
      }
      
      // Close the current tab and open in Edge
      chrome.tabs.remove(tabId, () => {
        // Create a temporary redirect page with a unique identifier
        chrome.tabs.create({
          url: `data:text/html,
            <html>
              <head>
                <title>Redirecting to Microsoft Edge</title>
                <meta name="edge-redirector" content="redirect-page">
                <meta http-equiv="refresh" content="0;url=${encodeURIComponent(edgeUrl)}">
              </head>
              <body style="font-family: system-ui; text-align: center; padding: 50px;">
                <h2>Redirecting to Microsoft Edge...</h2>
                <p>URL: ${url}</p>
                <p>If Edge doesn't open automatically, <a href="${edgeUrl}" id="edge-link">click here</a>.</p>
                <script>
                  // Only redirect once and use a more reliable method
                  if (!sessionStorage.getItem('redirected')) {
                    sessionStorage.setItem('redirected', 'true');
                    try {
                      // Try a few different methods to increase reliability
                      window.location.href = "${edgeUrl}";
                      // If that doesn't work, try setTimeout
                      setTimeout(function() {
                        document.getElementById('edge-link').click();
                      }, 500);
                    } catch(e) {
                      console.error("Redirect failed:", e);
                    }
                  }
                </script>
              </body>
            </html>`
        });
      });
    } else if (os === "Windows") {
      // For Windows native method, similar approach with fixed URL format
      edgeUrl = `microsoft-edge:${url}`;
      
      chrome.tabs.remove(tabId, () => {
        chrome.tabs.create({
          url: `data:text/html,
            <html>
              <head>
                <title>Opening in Microsoft Edge</title>
                <meta name="edge-redirector" content="redirect-page">
                <meta http-equiv="refresh" content="0;url=${encodeURIComponent(edgeUrl)}">
              </head>
              <body style="font-family: system-ui; text-align: center; padding: 50px;">
                <h2>Opening in Microsoft Edge...</h2>
                <p>URL: ${url}</p>
                <p>If Edge doesn't open automatically, <a href="${edgeUrl}" id="edge-link">click here</a>.</p>
                <script>
                  // Only redirect once
                  if (!sessionStorage.getItem('redirected')) {
                    sessionStorage.setItem('redirected', 'true');
                    try {
                      window.location.href = "${edgeUrl}";
                      setTimeout(function() {
                        document.getElementById('edge-link').click();
                      }, 500);
                    } catch(e) {
                      console.error("Redirect failed:", e);
                    }
                  }
                </script>
              </body>
            </html>`
        });
      });
    } else {
      // For other platforms, show instructions
      chrome.tabs.update(tabId, {
        url: `data:text/html,
          <html>
            <head>
              <title>Edge Redirection</title>
              <meta name="edge-redirector" content="redirect-page">
            </head>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h2>Please open this URL in Microsoft Edge</h2>
              <p>Your operating system (${os}) doesn't support automatic redirection.</p>
              <p>Please copy and paste this URL into Edge:</p>
              <input type="text" value="${url}" style="width: 80%; padding: 10px; margin: 20px;" onclick="this.select()">
            </body>
          </html>`
      });
    }
  });
}

// Improved check if a URL should be redirected to Edge
function shouldRedirect(url) {
  return new Promise((resolve) => {
    // Skip data: URLs and our redirect pages completely
    if (url.startsWith('data:') || redirectTracker.isRedirectPage(url) || url.startsWith('chrome-extension://')) {
      resolve(false);
      return;
    }
    
    chrome.storage.local.get('settings', (data) => {
      const settings = data.settings || DEFAULT_SETTINGS;
      
      // If extension is disabled, don't redirect
      if (!settings.enabled) {
        resolve(false);
        return;
      }
      
      // Check if URL matches any domain in the settings
      const shouldRedirect = settings.domains.some(domain => {
        // Handle wildcards (e.g., *.example.com)
        if (domain.startsWith('*.')) {
          const baseDomain = domain.substring(2);
          return url.includes(baseDomain) && 
                 (url.includes(`://${baseDomain}`) || url.includes(`.${baseDomain}`));
        }
        // Use more exact matching for non-wildcard domains
        try {
          const urlObj = new URL(url);
          const hostName = urlObj.hostname;
          
          // Check if hostname matches domain or ends with .domain
          return hostName === domain || hostName.endsWith(`.${domain}`);
        } catch (e) {
          // If URL parsing fails, fall back to simple includes
          return url.includes(domain);
        }
      });
      
      resolve(shouldRedirect);
    });
  });
}

// Listen for navigation events - only use onBeforeNavigate to prevent double redirects
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only process main frame navigations (not iframes, etc.)
  if (details.frameId === 0) {
    const redirect = await shouldRedirect(details.url);
    if (redirect) {
      openInEdge(details.url, details.tabId);
    }
  }
});

// Removed the chrome.tabs.onUpdated listener to prevent double redirects

// Listen for messages from the popup or options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSettings") {
    chrome.storage.local.get('settings', (data) => {
      sendResponse(data.settings || DEFAULT_SETTINGS);
    });
    return true; // Keep the message channel open for the async response
  }
  
  if (message.action === "saveSettings") {
    chrome.storage.local.set({ settings: message.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === "toggleEnabled") {
    chrome.storage.local.get('settings', (data) => {
      const settings = data.settings || DEFAULT_SETTINGS;
      settings.enabled = !settings.enabled;
      chrome.storage.local.set({ settings }, () => {
        sendResponse({ success: true, enabled: settings.enabled });
      });
    });
    return true;
  }
});
