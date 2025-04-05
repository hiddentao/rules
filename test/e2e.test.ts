import { afterAll, afterEach, beforeAll, beforeEach, describe, it, spyOn } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";
import { expect } from "chai";
import { execa } from "execa";
import tmp from "tmp";

// Helper function to fetch content from a URL
async function fetchContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

// Helper function to check file content against expected content (or URL)
async function checkFileContent(filePath: string, expectedContentOrUrl: string) {
  const fileExists = await fs.stat(filePath).then(() => true, () => false);
  expect(fileExists, `File ${filePath} should exist`).to.be.true;

  const actualContent = await fs.readFile(filePath, "utf-8");
  let expectedContent = expectedContentOrUrl;
  if (expectedContentOrUrl.startsWith("http")) {
    expectedContent = await fetchContent(expectedContentOrUrl);
  }

  expect(actualContent.trim()).to.equal(expectedContent.trim());
}

// Helper function to check directory existence
async function checkDirectoryExists(dirPath: string) {
  const dirExists = await fs.stat(dirPath).then((stats) => stats.isDirectory(), () => false);
  expect(dirExists, `Directory ${dirPath} should exist`).to.be.true;
}

// Helper function to execute the rules binary
async function execRules(args: string[]): Promise<{ exitCode: number, stderr: string }> {
  try {
    const binPath = path.resolve(__dirname, "../bin/rules");
    const { stdout, stderr } = await execa(binPath, args);
    return { 
      exitCode: 0,
      stderr
    };
  } catch (error: any) {
    if (error.exitCode !== undefined) {
      return {
        exitCode: error.exitCode,
        stderr: error.stderr || ""
      };
    }
    throw error;
  }
}

describe("End-to-End Installation Tests", () => {
  let tempDir: string;
  let tempDirObj: tmp.DirResult;
  let originalCwd: string;
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;

  // Set default timeout for all tests to 20 seconds
  const TEST_TIMEOUT = 20000;

  beforeEach(async () => {
    // Create a unique temp directory for all tests in this suite using tmp package
    tempDirObj = tmp.dirSync({ unsafeCleanup: true, prefix: 'rules-e2e-test-' });
    tempDir = tempDirObj.name;
    originalCwd = process.cwd();
    // Navigate to temp dir and reset mocks before each test
    process.chdir(tempDir);
    // Silence output 
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(async () => {
    // Restore mocks and CWD after each test
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    process.chdir(originalCwd);
    // Clean up temp directory using tmp's built-in cleanup
    tempDirObj.removeCallback();
  });

  describe("Installation from hiddentao/rules repository", () => {
    const repoBase = "hiddentao/rules/test/data";
    const rawContentBase = "https://raw.githubusercontent.com/hiddentao/rules/main/test/data";

    it("should download cursor rules folder from /cursorfolder", async () => {
      await execRules([
        "install", `${repoBase}/cursorfolder`, "--cursor"
      ]);
      const rulesDir = path.join(tempDir, ".cursor", "rules");
      await checkDirectoryExists(rulesDir);
      const files = await fs.readdir(rulesDir);
      expect(files.length).to.be.greaterThan(0);
      await checkFileContent(path.join(rulesDir, "1.mdc"), `${rawContentBase}/cursorfolder/.cursor/rules/1.mdc`);
      await checkFileContent(path.join(rulesDir, "2.mdc"), `${rawContentBase}/cursorfolder/.cursor/rules/2.mdc`);
    }, TEST_TIMEOUT);

    it("should download cursor rules file from /cursorfile", async () => {
      await execRules([
        "install", `${repoBase}/cursorfile` // No flag, should default
      ]);
      const rulesFile = path.join(tempDir, ".cursorrules");
      await checkFileContent(rulesFile, `${rawContentBase}/cursorfile/.cursorrules`);
    }, TEST_TIMEOUT);

    it("should download windsurf rules file from /windsurffile", async () => {
      await execRules([
        "install", `${repoBase}/windsurffile`, "--windsurf"
      ]);
      const rulesFile = path.join(tempDir, ".windsurfrules");
      await checkFileContent(rulesFile, `${rawContentBase}/windsurffile/.windsurfrules`);
    }, TEST_TIMEOUT);

    it("should convert from cursor file to windsurf file", async () => {
      await execRules([
        "install", `${repoBase}/cursorfile`, "--windsurf"
      ]);
      
      const rulesFile = path.join(tempDir, ".windsurfrules");

      await checkFileContent(rulesFile, `${rawContentBase}/cursorfile/.cursorrules`);
    }, TEST_TIMEOUT);

    it("should convert from windsurf file to cursor directory", async () => {
      await execRules([
        "install", `${repoBase}/windsurffile`, "--cursor"
      ]);
      const cursorDir = path.join(tempDir, ".cursor", "rules");
      await checkDirectoryExists(cursorDir);
      const mdcFile = path.join(cursorDir, "rules.mdc");

      const windsurfContent = await fetchContent(`${rawContentBase}/windsurffile/.windsurfrules`);
      
      const expectedContent = `---
alwaysApply: true
---

${windsurfContent}`;
      
      await checkFileContent(mdcFile, expectedContent);
    }, TEST_TIMEOUT);

    it("should convert from cursor directory to windsurf file", async () => {
      await execRules([
        "install", `${repoBase}/cursorfolder`, "--windsurf"
      ]);
      
      const rulesFile = path.join(tempDir, ".windsurfrules");
      
      // Fetch remote file contents
      const file1Content = await fetchContent(`${rawContentBase}/cursorfolder/.cursor/rules/1.mdc`);
      const file2Content = await fetchContent(`${rawContentBase}/cursorfolder/.cursor/rules/2.mdc`);
      
      // According to converter.ts concatenateDirectoryFiles logic, files are sorted alphabetically
      // and concatenated with file headers in the format:
      // # File: {relativePath}\n\n{content}\n
      const expectedContent = `# File: 1.mdc

${file1Content}

# File: 2.mdc

${file2Content}`;
      
      await checkFileContent(rulesFile, expectedContent);
    }, TEST_TIMEOUT);

    it("should fail for invalid repository subfolder path", async () => {
      const { exitCode, stderr } = await execRules([
        "install", "hiddentao/rules/test/data/invalidpath"
      ]);
      expect(exitCode).to.equal(1);
      expect(stderr).to.include("No rules found");
    }, TEST_TIMEOUT);

    it("should fail if valid path contains no rules", async () => {
      const { exitCode, stderr } = await execRules([
        "install", "hiddentao/rules/src" // Valid path, no rules
      ]);
      expect(exitCode).to.equal(1);
      expect(stderr).to.include("No rules found");
    }, TEST_TIMEOUT);

    describe("Installation from repository with all rule types", () => {
      const allRepoPath = `${repoBase}/all`;
      const allRawContentBase = `${rawContentBase}/all`;

      it("should download cursor rules folder when --cursor flag is used", async () => {
        await execRules([
          "install", allRepoPath, "--cursor"
        ]);
        const rulesDir = path.join(tempDir, ".cursor", "rules");
        await checkDirectoryExists(rulesDir);
        const files = await fs.readdir(rulesDir);
        expect(files.length).to.be.greaterThan(0);
        await checkFileContent(path.join(rulesDir, "1.mdc"), `${allRawContentBase}/.cursor/rules/1.mdc`);
        await checkFileContent(path.join(rulesDir, "2.mdc"), `${allRawContentBase}/.cursor/rules/2.mdc`);
      }, TEST_TIMEOUT);

      it("should download windsurf rules file when --windsurf flag is used", async () => {
        await execRules([
          "install", allRepoPath, "--windsurf"
        ]);
        const rulesFile = path.join(tempDir, ".windsurfrules");
        await checkFileContent(rulesFile, `${allRawContentBase}/.windsurfrules`);
      }, TEST_TIMEOUT);
    });
  });
}); 