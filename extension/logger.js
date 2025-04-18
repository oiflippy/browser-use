const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const STORAGE_KEY = 'browser_use_logs';
const MAX_LOGS = 1000; // Limit the number of logs stored

/**
 * Retrieves logs from storage.
 * @returns {Promise<Array>} A promise that resolves with the array of logs.
 */
async function getLogs() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Saves logs to storage, ensuring the maximum limit is not exceeded.
 * @param {Array} logs The array of logs to save.
 */
async function saveLogs(logs) {
  // Ensure logs don't exceed the maximum limit
  if (logs.length > MAX_LOGS) {
    logs = logs.slice(logs.length - MAX_LOGS); // Keep the most recent logs
  }
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: logs }, resolve);
  });
}

/**
 * Logs a message with a specific level.
 * @param {string} level The log level (e.g., LOG_LEVELS.INFO).
 * @param {string} message The message to log.
 * @param {any} [details] Optional details to include with the log.
 */
async function log(level, message, details = null) {
  if (!Object.values(LOG_LEVELS).includes(level)) {
    console.error(`Invalid log level: ${level}`);
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message };
  if (details) {
    logEntry.details = details;
  }

  try {
    const currentLogs = await getLogs();
    currentLogs.push(logEntry);
    await saveLogs(currentLogs);
    // Notify sidepanel if it's open
    chrome.runtime.sendMessage({ type: "LOG_UPDATED" }).catch(err => {
        // Ignore error if the receiving end doesn't exist (e.g., sidepanel closed)
        if (err.message !== "Could not establish connection. Receiving end does not exist.") {
            console.error("Error sending log update message:", err);
        }
    });
  } catch (error) {
    console.error('Error logging message:', error);
  }
}

/**
 * Clears all logs from storage.
 */
async function clearLogs() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, () => {
        chrome.runtime.sendMessage({ type: "LOG_UPDATED" }).catch(err => {
            if (err.message !== "Could not establish connection. Receiving end does not exist.") {
                console.error("Error sending log update message after clear:", err);
            }
        });
        resolve();
    });
  });
}

// Example usage (optional, for testing in background script or other contexts)
// log(LOG_LEVELS.INFO, 'Logger initialized.');
// log(LOG_LEVELS.WARN, 'This is a warning message.');
// log(LOG_LEVELS.ERROR, 'An error occurred.', { code: 500, component: 'API' });

// Export functions if using modules (adjust based on your extension structure)
// If not using modules, these functions will be available globally when the script is loaded.
// export { log, getLogs, clearLogs, LOG_LEVELS };