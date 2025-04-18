console.log("Browser Use Content Script Loaded.");

let automationInterval = null;

// Function to simulate automation task
function performAutomationStep() {
    console.log("Performing automation step on the page...");
    // Add your actual page manipulation logic here
    // Example: Find an element and click it, fill a form, etc.
    // Be mindful of the page context and potential errors.
    try {
        // Example: Change background color of the body
        document.body.style.backgroundColor = document.body.style.backgroundColor === 'lightblue' ? 'white' : 'lightblue';
        console.log("Simulated page interaction complete.");
    } catch (error) {
        console.error("Error during automation step:", error);
        // Stop automation if an error occurs
        stopAutomation();
    }
}

// Function to start automation
function startAutomation() {
    if (automationInterval) {
        console.log("Automation is already running.");
        return;
    }
    console.log("Starting automation...");
    // Run the automation step every 3 seconds (adjust as needed)
    automationInterval = setInterval(performAutomationStep, 3000);
    // Perform the first step immediately
    performAutomationStep();
}

// Function to stop automation
function stopAutomation() {
    if (automationInterval) {
        console.log("Stopping automation...");
        clearInterval(automationInterval);
        automationInterval = null;
        // Reset any visual changes if needed
        // document.body.style.backgroundColor = 'white';
    } else {
        console.log("Automation is not running.");
    }
}


// Listen for messages from the side panel or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);

    if (request.action === 'start') {
        startAutomation();
        sendResponse({ status: "Automation started" });
    } else if (request.action === 'stop') {
        stopAutomation();
        sendResponse({ status: "Automation stopped" });
    } else {
        console.log("Unknown action received:", request.action);
        sendResponse({ status: "Unknown action" });
    }

    // Return true to indicate you wish to send a response asynchronously
    // (although in this simple case, it's synchronous)
    return true;
});

// Optional: Clean up when the content script is unloaded (e.g., tab closed)
// This might not always trigger reliably depending on the browser lifecycle.
window.addEventListener('unload', () => {
    stopAutomation();
});