# Implementation Phases for "rules" CLI Tool

## Phase 1: Project Setup and Core Framework ✅ COMPLETED

### Tasks
- Set up project structure (src/, bin/, dist/, test/)
- Initialize TypeScript configuration
- Configure Bun as the build/runtime environment
- Set up linting and formatting with Biome
- Set up Husky with conventional commits for Git hooks
- Implement basic CLI structure using commander.js
- Implement logging module with color-coded output using picocolors
- Create error handling utilities
- Set up end-to-end testing framework with Bun's test framework
- Implement CI workflow for testing
- Centralize type definitions in a dedicated `types.ts` file

### Milestones
- Repository initialized with proper structure
- Biome configuration for linting and formatting
- Husky and conventional commits configured
- Basic CLI stub accepting commands but not executing logic
- Logging system functional with appropriate color coding
- Comprehensive test coverage for critical utilities
- CI pipeline running tests on push/PR

### Testing Focus
- Unit tests for logging configuration
- End-to-end test structure using Bun's test framework
- Testing framework setup with test data examples

## Phase 2: GitHub Client and Rule Type Detection ✅ COMPLETED

### Tasks
- Implement GitHub client using the following strategies:
  - Direct HTTP requests to raw.githubusercontent.com for file existence checks and content retrieval
  - Local Git cloning for directory content operations to avoid GitHub API rate limits
  - Repository caching system that reuses cloned repositories for 60 seconds
  - The `tmp` package for managing temporary directories with automatic cleanup
- Add repository and path validation logic
- Create logic to detect rule types (.cursor/rules folder, .cursorrules, .windsurfrules)
- Implement rule selection based on precedence rules
- Build interactive selection with inquirer when multiple rule types exist
- Add verbose logging for API operations
- Create centralized constants and type definitions:
  - `constants.ts` for paths, rule type information, and configuration values like cache expiration times
  - `types.ts` for shared type definitions
- Eliminate hardcoded paths and values throughout the codebase

### Milestones
- Functional GitHub client with proper error handling and repository caching
- Successful detection of different rule formats
- Working rule selection logic based on precedence
- Interactive selection prompt operational
- Centralized constants and type definitions
- Efficient repository cloning with temporary directory management

### Testing Focus
- End-to-end tests with 20-second timeouts for all tests
- End-to-end tests for rule type detection with various repository configurations
- End-to-end tests for precedence logic with multiple rule types
- End-to-end tests against test/data examples in hiddentao/rules repository
- End-to-end tests directly execute the bin/rules binary using execa, validating real-world usage
- Tests verify both exit codes and stderr output to ensure proper error messaging

## Phase 3: File Management and Rule Conversion ✅ COMPLETED

### Tasks
- Implement file management module
- Create conversion utilities for different rule formats
- Build logic to download and install selected rule type
- Handle path creation and file system operations
- Implement format conversion notification system
- Ensure MDC files config is set to "always attached" when converting to .cursor/rules
- Add verbose logging for file operations

### Milestones
- Working file download and installation
- Successful conversion between rule formats
- Proper error handling for file system operations
- Clear user notifications for conversions

### Testing Focus
- Unit tests for format conversion utilities
- End-to-end tests for file download and installation process
- End-to-end tests for all rule format combinations
- End-to-end tests validating converted output matches expected format
- Verification that MDC files config is correctly set to "always attached" during conversions

## Phase 4: Packaging and Distribution

### Tasks
- Configure TypeScript/Bun build process
- Set up NPM package structure with bin/rules entry point
- Implement native binary generation with Bun
- Create release-please configuration
- Build GitHub Actions workflow for automated releases
- Prepare documentation for installation and usage
- Configure release-please to work with conventional commits

### Milestones
- Successful build producing dist/rules.js
- Working bin/rules executable script
- Native binaries generated for multiple platforms
- Automated release process functional with semantic versioning based on commit types

### Testing Focus
- End-to-end tests with built package
- Verify binary execution on different platforms
- End-to-end tests for complete install flow from GitHub to local system

## Phase 5: Documentation and Final Testing

### Tasks
- Create comprehensive README.md with:
  - Quick description and features
  - Installation and usage guide
  - Developer guide (for contributors)
  - License information
- Create LICENSE.md file with MIT license
- Add MIT license to package.json
- Perform user acceptance testing
- Conduct comprehensive end-to-end testing
- Refine error messages and user feedback

### Milestones
- Complete README.md with all required sections
- LICENSE.md file created with MIT license
- MIT license properly referenced in package.json
- All tests passing with high coverage
- Successful end-to-end testing with real GitHub repositories
- Release candidate ready for distribution

### Testing Focus
- Comprehensive end-to-end tests against hiddentao/rules repository
- Validation of all user-facing error messages
- Performance testing for large rule sets

## Test Data Structure

The test/data folder contains sample rule files organized in the following structure to facilitate comprehensive testing:

- **test/data/all/**: Contains all three rule types (.cursor/rules folder, .cursorrules file, .windsurfrules file)
- **test/data/cursorfolder/**: Contains only the .cursor/rules folder
- **test/data/cursorfile/**: Contains only the .cursorrules file
- **test/data/windsurffile/**: Contains only the .windsurfrules file

This structure allows testing each rule type individually as well as testing scenarios where multiple rule types are present. The end-to-end tests use the `tmp` npm package to create temporary local folders that are automatically cleaned up after tests complete. These temporary folders are used to install the downloaded rules during testing, ensuring a clean test environment for each test case.

The test data is also available in the hiddentao/rules repository for comprehensive end-to-end testing across different rule formats and selection logic. 