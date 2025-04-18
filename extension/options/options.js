// Function to save options to chrome.storage.sync
function saveOptions(e) {
  e.preventDefault(); // Prevent default form submission

  const apiKey = document.getElementById('apiKey').value;
  const apiUrl = document.getElementById('apiUrl').value;

  chrome.storage.sync.set({
    apiKey: apiKey,
    apiUrl: apiUrl
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500); // Clear status after 1.5 seconds
  });
}

// Function to restore options from chrome.storage.sync
function restoreOptions() {
  // Use default values if nothing is stored yet
  chrome.storage.sync.get({
    apiKey: '',
    apiUrl: ''
  }, (items) => {
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('apiUrl').value = items.apiUrl;
  });
}

// Add event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);