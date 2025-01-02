# Keto Calculator Logic

## Target Values
System(website) derived except ratio
- Protein: 
- Fat: 
- Carbohydrates: 
- Calories: 
- Units: 
- Ratio: 4:1

## Adjustment Algorithm

### 1. Carbohydrate Adjustment
The algorithm first focuses on achieving the target carbohydrate level:
- Target: example 3.05g
- Acceptable Range: 2.745g (90%) to 3.66g (120%)
- Method:
  1. Identifies the food item contributing the most carbs
  2. Iteratively reduces that item's quantity
  3. Continues until carbs are within acceptable range
  4. Maximum 50 iterations to prevent infinite loops

### 2. Calorie and Ratio Adjustment
After carbs are optimized, the algorithm adjusts for calories and ketogenic ratio:
- Target Ratio: 4:1
- Process:
  1. Calculates required caloric adjustment
  2. Distributes changes proportionally across all ingredients
  3. Maintains ingredient ratios from initial input
  4. Stops if ratio exceeds 4.4:1 (110% of target)
  5. Maximum 50 iterations

### New Calorie and Ratio Adjustment Logic (Pseudo Code)
```javascript
function adjustCaloriesAndRatio(carbAdjustedInputs):
    // Constants
    TARGET_CAL = 700
    TARGET_RATIO = 4.0
    
    // Find highest fat and protein contributors (once, at start)
    highestFatIndex = findHighestFatContributor()
    highestProteinIndex = findHighestProteinContributor()
    
    // Main adjustment loop
    while (currentCalories < TARGET_CAL):
        // Increase protein by 1 unit
        adjustedInputs[highestProteinIndex] += 1
        
        // Apply change and get new stats
        writeToWebpage(adjustedInputs)
        currentStats = readFromWebpage()
        
        // Check if ratio dropped below target
        if (currentStats.ratio < TARGET_RATIO):
            // Increase fat by 1 to maintain ratio
            adjustedInputs[highestFatIndex] += 1
            writeToWebpage(adjustedInputs)
            currentStats = readFromWebpage()
        
        // Exit if we've reached or exceeded calories
        if (currentStats.calories >= TARGET_CAL):
            break
            
        // Safety check for maximum iterations
        if (iterations++ > MAX_ITERATIONS):
            break

    return adjustedInputs
```

### Key Points of New Logic:
1. Only two ingredients are modified:
   - Highest protein contributor
   - Highest fat contributor
2. Protein increases steadily (1 unit at a time)
3. Fat increases only when ratio drops below 4:1
4. Process continues until calories reach 700
5. Each change is immediately applied and verified
6. More predictable and controlled adjustments
7. Maintains ratio while building up calories

### 3. Input Processing
For each adjustment cycle:
1. Read current values from webpage
2. Calculate necessary changes
3. Apply rounded values to inputs
4. Trigger recalculation events
5. Verify changes through UI elements

### 4. Optimization Constraints
- All quantities must be non-negative
- Adjustments are made in whole number increments
- Changes are applied one at a time
- System waits for webpage recalculation between changes
- Maintains proportional relationships between ingredients

## Implementation Details

### Carb Reduction
```javascript
while ((currentCarb < lowerBound || currentCarb > upperBound) && iterations < maxIterations) {
    // Find highest carb contributor
    // Reduce by 1 unit
    // Recalculate totals
}
```

### Calorie Adjustment
```javascript
while ((currentCal < targetCal || currentRatio < targetRatio) && iterations < maxIterations) {
    // Calculate required calorie adjustment
    // Distribute proportionally
    // Apply changes
    // Check ratio bounds
}
```
