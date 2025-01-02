// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        console.log('Background received message:', request);
        
        // Handle different message types
        switch (request.type) {
            case 'getData':
                handleGetData(request.data)
                    .then(response => {
                        console.log('getData response:', response);
                        sendResponse({ success: true, data: response });
                    })
                    .catch(error => {
                        console.error('getData error:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                break;
                
            // Add other message type handlers here
            
            default:
                console.warn('Unknown message type:', request.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
        
    } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep message channel open for async response
});

async function handleGetData(data) {
    try {
        // Validate input data
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
        
        // Process data and return result
        return {
            // ... process data ...
        };
    } catch (error) {
        console.error('handleGetData error:', error);
        throw error;
    }
}

// Service worker activation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed and service worker activated');
});
