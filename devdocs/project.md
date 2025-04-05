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
- **Security:**  
  - Operate on public repositories (with potential for future authentication).
  - Validate inputs to prevent directory traversal and related vulnerabilities.
- **Scalability & Maintenance:**  
  - Modular design to allow future enhancements (e.g., additional rule formats or authentication support).
- **Usability:**  
  - Clear CLI feedback and error messages.
  - Colour-coded logging output:
    - White for normal logging.
    - Red for errors (output to stderr).
    - Lightgrey for verbose debug messages when `--verbose` is enabled.
- **Testing:**
  - Primary focus on end-to-end testing using Mocha to validate complete functionality.
  - Limited unit testing only for format conversion utilities and logging configuration.
  - Test data in test/data folder containing examples of all rule formats.
  - End-to-end tests that verify downloading rules from the hiddentao/rules repository.
- **Code Quality:**
  - Consistent code style and formatting using Biome.
  - Commit message standardization using conventional commits and Husky.
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
- **Testing:**
  - Mocha for end-to-end testing.
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
     Use Node.js native `fetch` for HTTP requests.
   - **Responsibilities:**  
     - Validate repository and subfolder paths.
     - Check for the existence of `.cursor/rules`, `.cursorrules`, and `.windsurfrules`.

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
       Create the `.cursor/rules` folder and place the file inside as `rules.mdc`.
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

8. **Testing Module:**
   - **Purpose:**
     Ensure code quality and functionality.
   - **Implementation:**
     Use Mocha for end-to-end testing.
   - **Responsibilities:**
     - Unit tests limited to format conversion utilities and logging configuration.
     - End-to-end tests for complete workflows.
     - Verify rule downloads from the hiddentao/rules repository.
     - Test rule format conversion through end-to-end tests.

## Build & Publishing Process

- **Build Process:**
  - Transpile TypeScript to JavaScript using Bun.
- **Packaging:**
  - Package the tool as an NPM module with an executable at `bin/rules` that calls `dist/rules.js`.
- **Native Binary Generation:**
  - Use Bun's native executable build process to generate binaries for multiple platforms.
- **Publishing Workflow:**
  - Create a GitHub Actions workflow to automate publishing.
  - Use release-please for release management and upload the NPM package and native binaries to the GitHub Releases page.
  - Leverage conventional commits to determine version bumps automatically.
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
   - Set up end-to-end testing with Mocha.
   - Develop unit tests for format conversion and logging configuration.
   - Prepare test data folder with example rule formats.

2. **Integration & End-to-End Testing:**
   - Integrate all modules and implement comprehensive error handling.
   - Develop end-to-end tests for complete workflows.
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