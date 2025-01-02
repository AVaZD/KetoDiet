# keto-diet-calculator Chrome Extension

## Overview
A Chrome extension for automating ketogenic diet calculations on ketodietcalculator.org.

## Features
- Automated calculation and ratio management
- Target value calibration system
- Interactive popup interface
- Connection retry mechanism
- Real-time status updates
- Error handling and recovery

## Project Structure
```
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js          # Popup interface logic
├── content.js        # Webpage interaction logic
├── background.js     # Service worker logic
├── targets.js        # Target management logic
└── docs/            # Documentation
    ├── CHANGELOG.md
    ├── LOGIC.md
    └── ROADMAP.md
```

## Technical Details


### Core Algorithm
1. Carbohydrate Adjustment
   - Target: in grams (90-120% acceptable range)
   - Iteratively reduces highest carb contributor
   - Maximum 50 iterations

2. Calorie and Ratio Adjustment
   - Target Calories: what is the systems
   - Target Ratio: 4:1
   - Adjusts using highest fat and protein contributors
   - Maintains ratio while building calories

## Installation
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extension directory

## Development
See [ROADMAP.md](docs/ROADMAP.md) for planned features and [CHANGELOG.md](docs/CHANGELOG.md) for version history.

## Technical Documentation
- [Logic Documentation](docs/LOGIC.md) - Detailed calculation logic
