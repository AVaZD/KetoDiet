# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2024-01-01

### Fixed
- Connection handling between popup and content script
- Message passing reliability
- Error handling and user feedback
- Content script initialization
- Script injection timing

### Added
- Connection retry mechanism
- Status feedback messages
- Content script presence verification
- Improved error messages
- Debug logging

### Known Issues
- Second calculation trigger: After initial calculation, the trigger buttons reappear and clicking "Yes" initiates another calculation cycle
- This secondary calculation may adjust carbs slightly if they're above threshold
- The behavior is non-blocking but may cause confusion for users

## [1.0.0] - 2024-12-21

### Added
- Initial release of the Keto Calculator Chrome Extension
- Automated calculation functionality
- Real-time ratio management
- Interactive popup interface
- Background service worker implementation
- Webpage data extraction and manipulation
- Target value calibration system
- Iterative adjustment algorithm

### Technical Features
- Message-passing architecture
- Content script injection
- Background service worker
- Chrome extension manifest v3 support

### Development Setup
- Basic project structure
- Development environment configuration
- Extension loading capabilities
