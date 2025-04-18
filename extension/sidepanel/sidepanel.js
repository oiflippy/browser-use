const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const logLevelFilter = document.getElementById('logLevelFilter');
const clearLogsButton = document.getElementById('clearLogsButton');
const logContainer = document.getElementById('logContainer');

// --- Log Display Logic ---

/**
 * Displays logs in the side panel, applying the current filter.
 */
async function displayLogs() {
    const selectedLevel = logLevelFilter.value;
    logContainer.innerHTML = ''; // Clear previous logs

    try {
        const logs = await getLogs(); // Assumes getLogs is available from logger.js
        const filteredLogs = logs.filter(log => selectedLevel === 'ALL' || log.level === selectedLevel);

        if (filteredLogs.length === 0) {
            logContainer.textContent = 'No logs to display.';
            return;
        }

        filteredLogs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.classList.add('log-entry', `log-${log.level.toLowerCase()}`); // Add classes for styling

            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('log-timestamp');
            timestampSpan.textContent = `${new Date(log.timestamp).toLocaleString()}`;

            const levelSpan = document.createElement('span');
            levelSpan.classList.add('log-level');
            levelSpan.textContent = `[${log.level}]`;

            const messageSpan = document.createElement('span');
            messageSpan.classList.add('log-message');
            messageSpan.textContent = log.message;

            logElement.appendChild(timestampSpan);
            logElement.appendChild(levelSpan);
            logElement.appendChild(messageSpan);

            if (log.details) {
                const detailsPre = document.createElement('pre');
                detailsPre.classList.add('log-details');
                detailsPre.textContent = JSON.stringify(log.details, null, 2);
                logElement.appendChild(detailsPre);
            }

            logContainer.appendChild(logElement);
        });

        // Scroll to the bottom
        logContainer.scrollTop = logContainer.scrollHeight;

    } catch (error) {
        console.error("Error displaying logs:", error);
        logContainer.textContent = 'Error loading logs.';
    }
}

// --- Event Listeners ---

startButton.addEventListener('click', () => {
    startButton.disabled = true;
    stopButton.disabled = false;
    sendMessageToContentScript('start');
    // Optionally log the start action
    // log(LOG_LEVELS.INFO, 'Automation started.'); // Requires logger.js functions to be accessible
});

stopButton.addEventListener('click', () => {
    startButton.disabled = false;
    stopButton.disabled = true;
    sendMessageToContentScript('stop');
    // Optionally log the stop action
    // log(LOG_LEVELS.INFO, 'Automation stopped.'); // Requires logger.js functions to be accessible
});

logLevelFilter.addEventListener('change', displayLogs);

clearLogsButton.addEventListener('click', async () => {
    try {
        await clearLogs(); // Assumes clearLogs is available from logger.js
        // displayLogs will be called automatically by the LOG_UPDATED message listener
        console.log("Logs cleared.");
    } catch (error) {
        console.error("Error clearing logs:", error);
    }
});

// Listen for messages from other parts of the extension (e.g., logger.js)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "LOG_UPDATED") {
        console.log("Received LOG_UPDATED message, refreshing logs.");
        displayLogs();
        sendResponse({ status: "Logs updated in sidepanel" }); // Optional response
    }
    // Return true to indicate you wish to send a response asynchronously
    // (although not strictly necessary here as we respond immediately)
    return true;
});


// --- Utility Functions ---

function sendMessageToContentScript(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending message:', chrome.runtime.lastError.message);
                    // Log the error
                    log(LOG_LEVELS.ERROR, `Failed to send '${action}' message to content script`, { error: chrome.runtime.lastError.message });
                    // Reset button states on error
                    startButton.disabled = false;
                    stopButton.disabled = true;
                } else {
                    console.log(`Message '${action}' sent successfully, response:`, response);
                    // Optionally log success
                    // log(LOG_LEVELS.INFO, `Message '${action}' sent to content script.`);
                }
            });
        } else {
            const errorMsg = 'Could not find active tab or tab ID.';
            console.error(errorMsg);
            log(LOG_LEVELS.ERROR, `Failed to send '${action}' message: ${errorMsg}`);
             // Reset button states on error
             startButton.disabled = false;
             stopButton.disabled = true;
        }
    });
}

// --- Initialization ---

// Initial state: Start button enabled, Stop button disabled
startButton.disabled = false;
stopButton.disabled = true;

// Load and display logs when the side panel opens
document.addEventListener('DOMContentLoaded', displayLogs);

// Styling is now handled by sidepanel.css