document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    const button = document.getElementById('triggerUpdate');
    const status = document.createElement('div');
    status.id = 'status';
    status.style.cssText = 'margin-top: 10px; color: #666;';
    document.body.appendChild(status);

    // Update function to include ratio
    function updateTargetDisplays(targets) {
        document.getElementById('proteinTarget').textContent = targets.protein?.toFixed(2) || '-';
        document.getElementById('fatTarget').textContent = targets.fat?.toFixed(2) || '-';
        document.getElementById('carbsTarget').textContent = targets.carbs?.toFixed(2) || '-';
        document.getElementById('caloriesTarget').textContent = targets.calories?.toFixed(0) || '-';
        document.getElementById('systemRatio').textContent = targets.ratio?.toFixed(1) || '4.0';
    }

    if (!button) {
        status.textContent = 'Error: Button not found';
        return;
    }

    // Add refresh button handler
    const refreshButton = document.getElementById('refreshTargets');
    refreshButton.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab?.url?.includes('ketodietcalculator.org')) {
                status.textContent = 'Please navigate to ketodietcalculator.org';
                return;
            }

            const targets = await chrome.tabs.sendMessage(tab.id, { message: "getTargets" });
            if (targets) {
                updateTargetDisplays(targets);
                // Show brief success message
                status.textContent = 'Targets refreshed!';
                setTimeout(() => status.textContent = '', 1000);
            }
        } catch (error) {
            console.error('Error refreshing targets:', error);
            status.textContent = 'Error refreshing targets';
            setTimeout(() => status.textContent = '', 2000);
        }
    });

    // Add custom ratio handler with immediate effect
    const customRatioInput = document.getElementById('customRatio');
    if (customRatioInput) {
        // Force initial value to 4.0
        customRatioInput.value = "4.0";
        chrome.storage.local.set({ customRatio: 4.0 });

        customRatioInput.addEventListener('input', function() {
            const newRatio = parseFloat(this.value);
            if (newRatio >= 2.0 && newRatio <= 6.0) {
                chrome.storage.local.set({ 
                    customRatio: newRatio,
                    selectedRatioType: 'custom'  // Auto-select custom when user types
                });
                document.querySelector('input[name="ratioChoice"][value="custom"]').checked = true;
            }
        });
    }

    // Add ratio choice handler
    const ratioChoices = document.querySelectorAll('input[name="ratioChoice"]');
    ratioChoices.forEach(radio => {
        radio.addEventListener('change', function() {
            chrome.storage.local.set({ selectedRatioType: this.value });
            updateRatioDisplay();
        });
    });

    // Function to update ratio display based on selection
    function updateRatioDisplay() {
        chrome.storage.local.get(['selectedRatioType', 'customRatio'], function(result) {
            const usePageRatio = result.selectedRatioType === 'page';
            const customRatioInput = document.getElementById('customRatio');
            customRatioInput.disabled = usePageRatio;
            
            // Don't update custom ratio value when switching, preserve user's custom value
            if (!usePageRatio && result.customRatio) {
                customRatioInput.value = result.customRatio.toString();
            }
        });
    }

    // Load saved ratio choice
    chrome.storage.local.get(['selectedRatioType'], function(result) {
        const ratioType = result.selectedRatioType || 'page';
        document.querySelector(`input[name="ratioChoice"][value="${ratioType}"]`).checked = true;
        updateRatioDisplay();
    });

    // Modify tryConnectToContentScript to get targets
    async function tryConnectToContentScript(tab, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try to inject script if not already injected
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.hasContentScript || false
                }).catch(() => false);

                // Inject our content script
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                // Wait for script to initialize
                await new Promise(resolve => setTimeout(resolve, 500));

                // Test connection
                const response = await chrome.tabs.sendMessage(tab.id, { message: "ping" });
                if (response?.status === "pong") {
                    // Get targets after successful connection
                    const targets = await chrome.tabs.sendMessage(tab.id, { message: "getTargets" });
                    if (targets) {
                        updateTargetDisplays(targets);
                        return true;
                    }
                }
            } catch (error) {
                console.log(`Connection attempt ${i + 1} failed:`, error);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return false;
    }

    button.addEventListener('click', async function() {
        try {
            status.textContent = 'Checking page...';
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab?.url?.includes('ketodietcalculator.org')) {
                status.textContent = 'Please navigate to ketodietcalculator.org';
                return;
            }

            status.textContent = 'Connecting...';
            const connected = await tryConnectToContentScript(tab);
            
            if (!connected) {
                throw new Error('Could not connect to page. Please refresh and try again.');
            }

            // Get the selected ratio type and custom ratio value
            const ratioSettings = await chrome.storage.local.get(['selectedRatioType', 'customRatio']);
            const useCustomRatio = ratioSettings.selectedRatioType === 'custom';
            
            // If using page ratio, send 'page' as the value, otherwise send the custom ratio
            const ratioValue = useCustomRatio ? 
                (parseFloat(ratioSettings.customRatio) || 4) : 
                'page';
            
            console.log('Using ratio:', useCustomRatio ? 'custom' : 'page', 'Value:', ratioValue);

            status.textContent = 'Updating...';
            const response = await chrome.tabs.sendMessage(tab.id, {
                message: "Trigger update",
                customRatio: ratioValue
            });
            
            if (response?.status === "success") {
                status.textContent = 'Update successful!';
                setTimeout(() => status.textContent = '', 2000);
            } else {
                throw new Error(response?.error || 'Update failed');
            }
        } catch (error) {
            console.error('Error:', error);
            status.textContent = `Error: ${error.message}`;
            setTimeout(() => status.textContent = '', 5000);
        }
    });
});