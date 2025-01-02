// content.js
window.hasContentScript = true;

// Target elements configuration
const TARGET_ELEMENTS = {
    fat: 'ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl07_LblGoalFat',
    protein: 'ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl07_LblGoalPro',
    carbs: 'ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl07_LblGoalCarb',
    calories: 'ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl07_LblGoalCal'
};

// Update this function to be more robust
function findTargetElements() {
    // Define patterns for the target elements
    const targetPatterns = {
        fat: /ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl\d+_LblGoalFat$/,
        protein: /ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl\d+_LblGoalPro$/,
        carbs: /ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl\d+_LblGoalCarb$/,
        calories: /ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl\d+_LblGoalCal$/
    };

    // Find all span elements that contain "LblGoal"
    const allSpans = Array.from(document.getElementsByTagName('span'))
        .filter(el => el.id && el.id.includes('LblGoal'));

    console.log('Found spans:', allSpans.map(s => s.id));

    // Find elements that match our patterns
    const foundElements = {};
    for (const [key, pattern] of Object.entries(targetPatterns)) {
        // Find element by pattern matching
        const element = allSpans.find(el => pattern.test(el.id));
        
        if (element) {
            foundElements[key] = element.id;
            console.log(`Found ${key} element:`, element.id);
        } else {
            console.warn(`No element found for ${key} pattern: ${pattern}`);
            // Try to find any similar elements for debugging
            const similar = allSpans
                .filter(el => el.id.includes(key))
                .map(el => el.id);
            if (similar.length > 0) {
                console.log(`Similar elements found for ${key}:`, similar);
            }
        }
    }

    return foundElements;
}

// Update extractTargetsFromPage to handle missing elements better
function extractTargetsFromPage() {
    try {
        const targetElements = findTargetElements();
        const targets = {};

        // Log all found elements for debugging
        console.log('Found target elements:', targetElements);

        for (const [key, elementId] of Object.entries(targetElements)) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Target element not found for ${key}: ${elementId}`);
                // Try to find alternative element
                const altElement = document.querySelector(`[id*="LblGoal${key.charAt(0).toUpperCase() + key.slice(1)}"]`);
                if (altElement) {
                    console.log(`Found alternative element for ${key}:`, altElement.id);
                    targets[key] = parseFloat(altElement.textContent) || 0;
                }
                continue;
            }
            targets[key] = parseFloat(element.textContent) || 0;
        }

        // Validate that we have all required targets
        const requiredTargets = ['fat', 'protein', 'carbs', 'calories'];
        const missingTargets = requiredTargets.filter(t => !targets[t]);
        
        if (missingTargets.length > 0) {
            throw new Error(`Missing required targets: ${missingTargets.join(', ')}`);
        }

        console.log('Extracted targets:', targets);
        return targets;
    } catch (error) {
        console.error('Error extracting targets:', error);
        throw error;
    }
}

console.log("Content script starting initialization...");

// Initialize functions directly in the page context
function setupFunctions(pageTargets) {
    // Define global variables
    window.globalSuffixes = [];
    
    // Initialize Suffixes
    window.initializeSuffixes = function() {
        console.log("initializeSuffixes() function called!");
        try {
            window.globalSuffixes = [];
            // Look for any input element matching the pattern
            const inputs = document.querySelectorAll('input[name*="txtActGrams"]');
            inputs.forEach(input => {
                const match = input.name.match(/ctl(\d+)\$txtActGrams/);
                if (match && match[1]) {
                    window.globalSuffixes.push(match[1]);
                }
            });
            
            window.globalSuffixes.sort((a, b) => parseInt(a) - parseInt(b));
            console.log("Initialized suffixes:", window.globalSuffixes);
            return window.globalSuffixes.length > 0;
        } catch (error) {
            console.error("Error in initializeSuffixes:", error);
            return false;
        }
    };

    // Read Data
    window.readDataFromWebpage = function() {
        const ids = ["LblTotalPro", "LblTotalFat", "LblTotalCarb", "LblTotalCal", "LblTotalUnits", "LblTotalRatio"];
        const outputLabels = {};
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                outputLabels[id] = parseFloat(element.textContent);
            }
        });
        
        // Get targets from page or fall back to defaults
        const pageTargets = extractTargetsFromPage();
        const goals = {
            Pro: pageTargets.protein || 16.67,
            Fat: pageTargets.fat || 69.01,
            Carb: pageTargets.carbs || 3.05,
            Cal: pageTargets.calories || 700,
            Units: 19.72,
            Ratio: 4
        };
        
        const baseName = "ctl00$MainContent$lvActualMeals$ctrl0$gvActualFoods$ctl";
        const initialInputs = window.globalSuffixes.map(suffix => {
            const fullName = `${baseName}${suffix}$txtActGrams`;
            const inputElement = document.querySelector(`[name="${fullName}"]`);
            return inputElement ? parseFloat(inputElement.value) || 0 : 0;
        });
        return { initialInputs, outputLabels, goals };
    };

    // Write Data
    window.writeOptimizedDataToWebpage = function(optimizedInputs) {
        const baseName = "ctl00$MainContent$lvActualMeals$ctrl0$gvActualFoods$ctl";
        window.globalSuffixes.forEach((suffix, i) => {
            const fullName = `${baseName}${suffix}$txtActGrams`;
            const inputElement = document.querySelector(`[name="${fullName}"]`);
            if (inputElement) {
                const roundedInput = Math.round(optimizedInputs[i]);
                inputElement.value = roundedInput;
                ['input', 'change'].forEach(eventType => {
                    inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
                });
                const downButtonName = `${baseName}${suffix}$IBtnDown`;
                const downButton = document.querySelector(`[name="${downButtonName}"]`);
                if (downButton) downButton.click();
            }
        });
    };

    // Iterative Adjustment
    window.performIterativeAdjustment = function(initialInputs, outputLabels) {
        // Get current targets
        const pageTargets = extractTargetsFromPage();
        const CARB_TARGET = pageTargets.carbs;
        const CARB_UPPER_BOUND = CARB_TARGET * 1.1;  // 10% tolerance
        const CARB_LOWER_BOUND = CARB_TARGET * 0.9;
        let iterations = 0;
        const MAX_ITERATIONS = 50;
        
        // Phase 1: Aggressive carb reduction
        let adjustedInputs = [...initialInputs];
        let currentCarb = outputLabels['LblTotalCarb'];
        
        while (currentCarb > CARB_UPPER_BOUND && iterations < MAX_ITERATIONS) {
            const carbContributors = window.globalSuffixes.map((suffix, index) => {
                const baseName = "ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl";
                const fullName = `${baseName}${suffix}_LblCalcCarb`;
                const carbElement = document.getElementById(fullName);
                const carbValue = carbElement ? parseFloat(carbElement.textContent) : 0;
                return { index, carbValue };
            }).sort((a, b) => b.carbValue - a.carbValue);

            // Reduce highest carb contributor more aggressively
            if (carbContributors[0].carbValue > 0) {
                const reductionAmount = Math.max(1, Math.floor(adjustedInputs[carbContributors[0].index] * 0.1));
                adjustedInputs[carbContributors[0].index] -= reductionAmount;
                if (adjustedInputs[carbContributors[0].index] < 0) {
                    adjustedInputs[carbContributors[0].index] = 0;
                }
            }

            window.writeOptimizedDataToWebpage(adjustedInputs);
            const newOutputLabels = window.readDataFromWebpage().outputLabels;
            currentCarb = newOutputLabels['LblTotalCarb'];
            iterations++;
        }

        return adjustedInputs;
    };

    // Adjust Calories and Ratio
    window.adjustCaloriesAndRatio = function(carbAdjustedInputs, outputLabels) {
        // Get current targets
        const pageTargets = extractTargetsFromPage();
        const CAL_TARGET = pageTargets.calories;
        const RATIO_TARGET = 4;  // This might need to be extracted if available on page
        let iterations = 0;
        const MAX_ITERATIONS = 100; // Increased due to single-unit adjustments
        let adjustedInputs = [...carbAdjustedInputs];

        // Find highest fat and protein contributors
        const nutritionInfo = adjustedInputs.map((_, index) => {
            const baseName = "ctl00_MainContent_lvActualMeals_ctrl0_gvActualFoods_ctl";
            const suffix = window.globalSuffixes[index];
            return {
                index,
                fat: parseFloat(document.getElementById(`${baseName}${suffix}_LblCalcFat`)?.textContent || '0'),
                protein: parseFloat(document.getElementById(`${baseName}${suffix}_LblCalcPro`)?.textContent || '0')
            };
        });

        const highestFat = nutritionInfo.reduce((prev, curr) => 
            (curr.fat > prev.fat) ? curr : prev, nutritionInfo[0]);
        const highestProtein = nutritionInfo.reduce((prev, curr) => 
            (curr.protein > prev.protein) ? curr : prev, nutritionInfo[0]);

        console.log('Starting adjustment with:', {
            highestFatIndex: highestFat.index,
            highestProteinIndex: highestProtein.index
        });

        while (iterations < MAX_ITERATIONS) {
            // Get current stats
            const currentStats = window.readDataFromWebpage().outputLabels;
            const currentCal = currentStats['LblTotalCal'];
            const currentRatio = currentStats['LblTotalRatio'];

            console.log('Current stats:', {
                calories: currentCal,
                ratio: currentRatio,
                iteration: iterations
            });

            // Stop if we've reached our calorie target
            if (currentCal >= CAL_TARGET) {
                console.log('Reached calorie target');
                break;
            }

            // Increment protein by 1 unit
            adjustedInputs[highestProtein.index] += 1;
            window.writeOptimizedDataToWebpage(adjustedInputs);
            
            // Check ratio after protein increase
            const statsAfterProtein = window.readDataFromWebpage().outputLabels;
            if (statsAfterProtein['LblTotalRatio'] < RATIO_TARGET) {
                // Add 1 unit of fat to maintain ratio
                adjustedInputs[highestFat.index] += 1;
                window.writeOptimizedDataToWebpage(adjustedInputs);
            }

            iterations++;
        }

        console.log('Adjustment complete:', {
            finalCalories: window.readDataFromWebpage().outputLabels['LblTotalCal'],
            finalRatio: window.readDataFromWebpage().outputLabels['LblTotalRatio'],
            iterations
        });

        return adjustedInputs;
    };

    // Show Trigger Buttons with state management
    window.showTriggerButtons = function() {
        console.log("showTriggerButtons() function called!");
        // Remove existing trigger if present
        const existingTrigger = document.getElementById('optimizerTrigger');
        if (existingTrigger) {
            existingTrigger.remove();
        }

        // Create new trigger container
        const div = document.createElement('div');
        div.id = 'optimizerTrigger';
        div.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 9999;
            background-color: #f9f9f9;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        const message = document.createElement('span');
        message.textContent = 'Do you need to do one more adjustment?';
        div.appendChild(message);

        // Add buttons with state handling
        ['Yes', 'No'].forEach(text => {
            const button = document.createElement('button');
            button.textContent = text;
            button.style.cssText = `
                margin-left: 10px;
                padding: 5px 10px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 3px;
                background-color: #fff;
            `;
            
            button.onclick = async () => {
                if (text === 'Yes') {
                    // Disable buttons during processing
                    div.querySelectorAll('button').forEach(btn => btn.disabled = true);
                    message.textContent = 'Processing...';
                    
                    try {
                        await window.runOptimization();
                        message.textContent = 'Update complete!';
                        setTimeout(() => div.remove(), 2000);
                    } catch (error) {
                        message.textContent = 'Error: ' + error.message;
                        // Re-enable buttons on error
                        div.querySelectorAll('button').forEach(btn => btn.disabled = false);
                    }
                } else {
                    div.remove();
                }
            };
            div.appendChild(button);
        });

        document.body.appendChild(div);
    };

    // New optimization function with state management
    window.runOptimization = async function() {
        // Check if already running
        if (window.isOptimizing) {
            throw new Error('Optimization already in progress');
        }

        try {
            window.isOptimizing = true;
            const { initialInputs, goals, outputLabels } = window.readDataFromWebpage();
            
            // Phase 1: Carb adjustment
            const carbAdjustedInputs = window.performIterativeAdjustment(initialInputs, outputLabels);
            
            // Phase 2: Calorie and ratio adjustment
            const finalAdjustedInputs = window.adjustCaloriesAndRatio(carbAdjustedInputs, outputLabels);
            
            // Final update
            await window.writeOptimizedDataToWebpage(finalAdjustedInputs);
            
            // Verify final values
            const finalStats = window.readDataFromWebpage().outputLabels;
            console.log('Final optimization results:', finalStats);
            
            // Clear optimization flag
            window.isOptimizing = false;
            return true;
            
        } catch (error) {
            window.isOptimizing = false;
            console.error('Optimization error:', error);
            throw error;
        }
    };

    // Update main function to use new runOptimization
    window.main = function() {
        window.runOptimization().catch(error => {
            console.error('Error in main:', error);
        });
    };
}

// Function to check if all required functions are available
function checkFunctions() {
    const requiredFunctions = [
        'initializeSuffixes',
        'readDataFromWebpage',
        'writeOptimizedDataToWebpage',
        'performIterativeAdjustment',
        'adjustCaloriesAndRatio',
        'showTriggerButtons',
        'main'
    ];

    return requiredFunctions.every(func => 
        typeof window[func] === 'function'
    );
}

// Initialize the extension with page targets
async function initializeExtension() {
    try {
        console.log("Starting extension initialization...");
        
        // Extract targets from page
        const pageTargets = extractTargetsFromPage();
        console.log("Extracted targets:", pageTargets);
        
        // Setup functions with extracted targets
        setupFunctions(pageTargets);
        
        // Check if functions are available
        if (!checkFunctions()) {
            throw new Error("Not all required functions are available");
        }
        
        // Initialize suffixes and show trigger buttons
        if (window.initializeSuffixes()) {
            window.showTriggerButtons();
            console.log("Extension initialized successfully!");
        } else {
            throw new Error("Failed to initialize suffixes");
        }
        
    } catch (error) {
        console.error("Error initializing extension:", error);
        throw error;
    }
}

// Start initialization based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    
    if (request.message === "ping") {
        sendResponse({status: "pong"});
        return true;
    }
    
    if (request.message === "Trigger update") {
        try {
            if (typeof window.main === 'function') {
                window.main();
                sendResponse({ status: "success" });
            } else {
                throw new Error("Main function not available");
            }
        } catch (error) {
            console.error("Error during update:", error);
            sendResponse({ status: "error", error: error.message });
        }
        return true;
    }
    
    if (request.message === "getTargets") {
        try {
            const targets = extractTargetsFromPage();
            sendResponse(targets);
        } catch (error) {
            console.error("Error getting targets:", error);
            sendResponse(null);
        }
        return true;
    }
    
    return true;
});

// Add error handling for data extraction
function extractPageData() {
    try {
        const data = {};
        // Add validation for each extracted value
        const elements = document.querySelectorAll('[id*="LblGoal"]');
        if (elements.length === 0) {
            throw new Error('No target elements found on page');
        }
        
        elements.forEach(element => {
            const value = parseFloat(element.textContent);
            if (isNaN(value)) {
                throw new Error(`Invalid value found in element: ${element.id}`);
            }
            data[element.id] = value;
        });
        
        return data;
    } catch (error) {
        console.error('Data extraction error:', error);
        throw error;
    }
}

// Add validation before sending messages
function sendMessageToBackground(data) {
    try {
        if (!data || Object.keys(data).length === 0) {
            throw new Error('No data to send');
        }
        
        return chrome.runtime.sendMessage({
            type: 'getData',
            data: data
        });
    } catch (error) {
        console.error('Message send error:', error);
        throw error;
    }
}