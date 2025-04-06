# Architectural Specification for "rules" CLI Tool

## Overview
The "rules" CLI tool is designed to fetch and install AI IDE rules for Cursor/Windsurf from a GitHub repository into the current folder. It supports different rule formats and performs format conversions as needed. The tool is implemented in TypeScript, built using Bun, and published as an NPM package along with platform-native binaries via GitHub Actions.

## Functional Requirements
- **Command Structure:**
  - `rules install <github_user_or_org>/<repo_name>`
  - `rules install <github_user_or_org>/<repo_name>/path/to/subfolder`
- **Fetching Behavior:**
  - Query the specified GitHub repository (and subfolder, if provided) to locate AI IDE rules.
  - Check for the existence of one or more of the following in the specified location:
    1. `.cursor/rules` (folder)
    2. `.cursorrules` (file)
    3. `.windsurfrules` (file)
- **Selection Logic:**
  - If multiple rule types exist, prompt the user to choose which one to download using the inquirer package.
  - CLI flags allow the user to specify the desired rule type:
    - `--windsurf`: download the `.windsurfrules` file if it exists, or select the available type (based on order precedence) and output it as a `.windsurfrules` file (notifying the user of any format conversion).
    - `--cursor`: download the `.cursor/rules` folder if it exists, or select the available type (based on order precedence) and output it as a `.cursor/rules` folder (notifying the user of any format conversion).
  - **Order of Precedence (when the preferred rule type is not available):**
    1. `.cursor/rules`
    2. `.cursorrules`
    3. `.windsurfrules`
- **Installation:**
  - Copy/download the chosen rules (file or folder) into the current local folder.

## Non-Functional Requirements
- **Performance:**  
  - Efficient GitHub queries and rapid file downloads.
  - Repository caching system that reuses locally cloned repositories for 60 seconds to reduce network requests.
  - Optimized directory operations using local Git cloning to minimize network traffic.
- **Security:**  
  - Operate on public repositories (with potential for future authentication).
  - Validate inputs to prevent directory traversal and related vulnerabilities.
  - Use local Git cloning and vanilla HTTP requests to avoid GitHub API rate limits and authentication issues.
- **Scalability & Maintenance:**  
  - Modular design to allow future enhancements (e.g., additional rule formats or authentication support).
  - Centralized constants for configuration values like cache expiration times.
- **Usability:**  
  - Clear CLI feedback and error messages.
  - Colour-coded logging output:
    - White for normal logging.
    - Red for errors (output to stderr).
    - Lightgrey for verbose debug messages when `--verbose` is enabled.
- **Testing:**
  - Primary focus on end-to-end testing using Bun's test framework to validate complete functionality.
  - E2E tests are configured with 20-second timeouts to accommodate longer-running operations.
  - Limited unit testing only for format conversion utilities and logging configuration.
  - Test data organized in test/data folder with the following structure:
    - test/data/all/: Contains all three rule types (.cursor/rules folder, .cursorrules file, .windsurfrules file)
    - test/data/cursorfolder/: Contains only the .cursor/rules folder
    - test/data/cursorfile/: Contains only the .cursorrules file
    - test/data/windsurffile/: Contains only the .windsurfrules file
  - End-to-end tests use the tmp npm package to create temporary local folders that are automatically cleaned up, ensuring isolated environments for rule installation during testing.
  - Comprehensive end-to-end tests that verify downloading rules from the hiddentao/rules repository.
  - End-to-end tests directly execute the actual bin/rules binary rather than calling the internal program API, ensuring real-world usage is properly tested.
  - The execa package is used to execute and capture output from the bin/rules binary in a cross-platform way.
  - Tests verify both exit codes and stderr output to ensure proper error messaging (e.g., "No rules found" in failure cases).
- **Code Quality:**
  - Consistent code style and formatting using Biome.
  - Commit message standardization using conventional commits and Husky.
  - Centralized type definitions in a dedicated `types.ts` file.
  - Path constants and rule type definitions stored in a dedicated `constants.ts` file to avoid hardcoding.
  - Updated detector logic to use constants and loop through rule types based on precedence.
  - Eliminated hardcoded paths and values throughout the codebase for better maintainability.
- **Documentation:**
  - Clear README.md with description, installation guide, usage examples, and contributor information.
  - MIT license included in LICENSE.md and package.json.

## System Architecture

### Technology Stack
- **Language & Runtime:**  
  - TypeScript, transpiled to JavaScript.
  - Built using Bun.
- **Distribution:**  
  - Published as an NPM package.
  - Contains a `bin/rules` executable script that internally executes `dist/rules.js`.
  - Platform-native binaries are generated using Bun's native executable build process and published as assets in GitHub Releases via GitHub Actions.
- **Publishing:**  
  - Uses a GitHub Actions workflow with release-please to manage releases and upload assets (NPM package, native binaries, and `dist/rules.js`).
  - Leverages conventional commits for semantic versioning.
  - All conventional commit types (feat, fix, chore, docs, perf, refactor, style, test) are configured to trigger releases:
    - feat commits trigger minor releases
    - All other commit types trigger patch releases
  - Binary artifacts (rules-win.exe, rules-macos, rules-linux) from the ./dist-bin/ directory are automatically attached as downloadable assets to each GitHub release.
  - Release creation and publishing only occur when changes are merged to the main branch, and the release-please PR is accepted.
- **Testing:**
  - Bun's test framework for end-to-end testing with 20-second timeouts.
  - The execa package for cross-platform binary execution in tests.
  - Tmp package for temporary directory management with automatic cleanup.
  - GitHub Actions for continuous integration testing.
- **Code Quality:**
  - Biome for linting and formatting.
  - Husky for Git hooks to enforce conventional commits.
- **License:**
  - MIT License.

### Key Modules

1. **CLI Module:**
   - **Purpose:**  
     Handle command parsing and help text generation.
   - **Implementation:**  
     Utilize `commander.js` for command line interface creation.
   - **Responsibilities:**  
     - Parse commands (`install`) and flags (`--windsurf`, `--cursor`, `--verbose`).
     - Route execution to appropriate modules.

2. **Interactive Prompt Module:**
   - **Purpose:**  
     Resolve ambiguities when multiple rule types exist.
   - **Implementation:**  
     Utilize `inquirer` to prompt the user.
   - **Responsibilities:**  
     - Ask the user which rule type to download if multiple types are found.

3. **GitHub Client Module:**
   - **Purpose:**  
     Query GitHub for rule files/folders.
   - **Implementation:**  
     - Uses vanilla HTTP requests for file existence checks and content retrieval.
     - Uses local Git cloning for directory content operations to avoid GitHub API rate limits.
     - Implements a repository caching system that reuses locally cloned repositories for a configurable time period (default 60 seconds).
     - Uses the `tmp` package to manage temporary directories with automatic cleanup.
     - Centralized cache expiration time as a constant in `constants.ts`.
     - Optimized to minimize network traffic and avoid GitHub API rate limits entirely.
   - **Responsibilities:**  
     - Validate repository and subfolder paths.
     - Check for the existence of `.cursor/rules`, `.cursorrules`, and `.windsurfrules`.
     - Retrieve file contents via direct HTTP requests to raw.githubusercontent.com.
     - Clone repositories locally for directory operations and manage the cleanup.
     - Cache and reuse repository clones when possible to improve performance.

4. **File Manager Module:**
   - **Purpose:**  
     Handle file system operations.
   - **Responsibilities:**  
     - Copy/download the selected rule set into the current folder.

5. **Conversion Module:**
   - **Purpose:**  
     Convert between different rule formats as required.
   - **Conversion Details:**
     - **From `.cursor/rules` folder to `.cursorrules` or `.windsurfrules`:**  
       Concatenate all files into a single file.
     - **From `.cursorrules` or `.windsurfrules` to `.cursor/rules` folder:**  
       Create the `.cursor/rules` folder and place the file inside as `rules.mdc` with the MDC files config set to "always attached".
     - **Between `.windsurfrules` and `.cursorrules`:**  
       Simply rename the file.
   - **Responsibilities:**  
     - Notify the user about any format conversion performed.

6. **Logging Module:**
   - **Purpose:**  
     Provide consistent and colour-coded CLI output.
   - **Implementation:**  
     Use `picocolors` for colour formatting.
   - **Responsibilities:**  
     - Normal logging in white.
     - Error logging in red (to stderr).
     - Verbose logging in lightgrey when `--verbose` is enabled.

7. **Error Handling:**
   - **Purpose:**  
     Ensure robustness in asynchronous operations.
   - **Responsibilities:**  
     - Implement try-catch blocks in all asynchronous code.
     - Allow errors to propagate to a top-level handler that logs the error and exits the process abnormally.

8. **Constants and Types:**
   - **Purpose:**
     Centralize common constants and type definitions.
   - **Implementation:**
     - `constants.ts` defines file paths, rule type information, and configuration values like cache expiration times.
     - `types.ts` contains centralized type definitions used throughout the application.
   - **Responsibilities:**
     - Provide a single source of truth for constants to avoid hardcoding.
     - Define reusable types for consistent type safety across the application.
     - Centralize configuration values for easy adjustment.

9. **Rule Detector:**
   - **Purpose:**
     Identify and select rule types based on precedence.
   - **Implementation:**
     - Uses constants from `constants.ts` to avoid hardcoding.
     - Provides a selection algorithm that loops through rule types in precedence order.
   - **Responsibilities:**
     - Detect available rule types in a repository.
     - Select the appropriate rule type based on precedence when multiple are available.

10. **Testing Module:**
   - **Purpose:**
     Ensure code quality and functionality.
   - **Implementation:**
     - Use Bun's test framework for end-to-end testing with 20-second timeouts.
     - Use execa package for cross-platform binary execution in tests.
     - Validate both exit codes and stderr output for proper error checking.
   - **Responsibilities:**
     - Unit tests limited to format conversion utilities and logging configuration.
     - End-to-end tests for complete workflows.
     - Verify rule downloads from the hiddentao/rules repository.
     - Test rule format conversion through end-to-end tests.
     - Execute the actual bin/rules binary to validate real-world usage.

## Build & Publishing Process

- **Build Process:**
  - Transpile TypeScript to JavaScript using Bun.
- **Packaging:**
  - Package the tool as an NPM module with an executable at `bin/rules` that calls `dist/rules.js`.
- **Native Binary Generation:**
  - Use Bun's native executable build process to generate binaries for multiple platforms.
- **Publishing Workflow:**
  - Use GitHub Actions workflow to automate publishing.
  - Use release-please for release management with the following configuration:
    - All conventional commit types can trigger releases (feat, fix, chore, docs, perf, refactor, style, test)
    - Feature commits trigger minor version increments
    - All other commit types trigger patch version increments
  - Automatically upload all assets (NPM package and native binaries from ./dist-bin/) to GitHub Releases.
  - Two-phase release process:
    1. release-please creates a PR with the version bump and changelog updates
    2. Once the PR is merged, the release is created and binaries are published
- **Testing Workflow:**
  - Create a GitHub Actions workflow to run end-to-end tests on push and pull requests.
  - Focus on testing complete functionality rather than individual components.
- **Code Quality Workflow:**
  - Run Biome formatting and linting checks in CI.
  - Enforce conventional commits through Husky pre-commit hooks.
- **License:**
  - Include MIT license in LICENSE.md and package.json.

## Implementation Roadmap

1. **Module Development and Initial Testing:**
   - Set up project structure (e.g., `src/`, `bin/`, `dist/`, `test/`).
   - Configure Biome for linting and formatting.
   - Set up Husky with conventional commits.
   - Implement the CLI, logging, GitHub client, file management, and conversion modules.
   - Set up end-to-end testing with Bun's test framework.
   - Develop unit tests for format conversion and logging configuration.
   - Prepare test data folder with example rule formats.

2. **Integration & End-to-End Testing:**
   - Integrate all modules and implement comprehensive error handling.
   - Develop end-to-end tests for complete workflows with 20-second timeouts.
   - Set up CI workflow for automated testing.
   - Test against the hiddentao/rules repository.

3. **Build Process & Packaging:**
   - Configure Bun for TypeScript transpilation and native binary generation.
   - Ensure the `bin/rules` script correctly routes to `dist/rules.js`.
   - Test package installation and execution through end-to-end tests.

4. **Publishing Workflow:**
   - Develop a GitHub Actions workflow to automate the publishing process.
   - Configure release-please to work with conventional commits.
   - Use release-please for release management and upload the NPM package and native binaries to the GitHub Releases page.

5. **Documentation & Final Testing:**
   - Create README.md with quick description, features, installation guide, usage guide, and developer contribution guide.
   - Create LICENSE.md with MIT license.
   - Add MIT license to package.json.
   - Conduct final end-to-end testing with real-world scenarios.
   - Perform comprehensive end-to-end testing with real-world scenarios.

A detailed breakdown of implementation phases is available in the [phases.md](phases.md) document. 