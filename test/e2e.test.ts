import { afterAll, afterEach, beforeAll, beforeEach, describe, it, spyOn } from "bun:test";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect } from "chai";
import program from "../src/index";

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

describe("End-to-End Installation Tests", () => {
  let tempDir: string;
  let originalCwd: string;
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;
  let exitSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    // Create a unique temp directory for all tests in this suite
    tempDir = path.join(tmpdir(), `rules-e2e-test-${Math.random()}}`);
    await fs.mkdir(tempDir, { recursive: true });
    originalCwd = process.cwd();

    // Navigate to temp dir and reset mocks before each test
    process.chdir(tempDir);
    // Clear directory content before each test for isolation
    for (const file of await fs.readdir(tempDir)) {
        await fs.rm(path.join(tempDir, file), { recursive: true, force: true });
    }
    // Silence output and mock process.exit
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = spyOn(process, 'exit').mockImplementation(() => { throw new Error("process.exit called"); });
  });

  afterEach(async () => {
    // Restore mocks and CWD after each test
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
    process.chdir(originalCwd);
    // Clean up temp directory
    // await fs.rm(tempDir, { recursive: true, force: true });
  });


  describe("Installation from hiddentao/rules repository", () => {
    const repoBase = "hiddentao/rules/test/data";
    const rawContentBase = "https://raw.githubusercontent.com/hiddentao/rules/main/test/data";

    it("should download cursor rules folder from /cursorfolder", async () => {
      await program.parseAsync([
        "node", "rules", "install", `${repoBase}/cursorfolder`, "--cursor"
      ]);
      const rulesDir = path.join(tempDir, ".cursor", "rules");
      await checkDirectoryExists(rulesDir);
      const files = await fs.readdir(rulesDir);
      expect(files.length).to.be.greaterThan(0);
      await checkFileContent(path.join(rulesDir, "1.mdc"), `${rawContentBase}/cursorfolder/.cursor/rules/1.mdc`);
      await checkFileContent(path.join(rulesDir, "2.mdc"), `${rawContentBase}/cursorfolder/.cursor/rules/2.mdc`);
    });

    it("should download cursor rules file from /cursorfile", async () => {
      await program.parseAsync([
        "node", "rules", "install", `${repoBase}/cursorfile` // No flag, should default
      ]);
      const rulesFile = path.join(tempDir, ".cursorrules");
      await checkFileContent(rulesFile, `${rawContentBase}/cursorfile/.cursorrules`);
    });

    it("should download windsurf rules file from /windsurffile", async () => {
      await program.parseAsync([
        "node", "rules", "install", `${repoBase}/windsurffile`, "--windsurf"
      ]);
      const rulesFile = path.join(tempDir, ".windsurfrules");
      await checkFileContent(rulesFile, `${rawContentBase}/windsurffile/.windsurfrules`);
    });

    it("should convert from cursor file to windsurf file", async () => {
      await program.parseAsync([
        "node", "rules", "install", `${repoBase}/cursorfile`, "--windsurf"
      ]);
      
      const rulesFile = path.join(tempDir, ".windsurfrules");

      await checkFileContent(rulesFile, `${rawContentBase}/cursorfile/.cursorrules`);
    });

    it("should convert from windsurf file to cursor directory", async () => {
      await program.parseAsync([
        "node", "rules", "install", `${repoBase}/windsurffile`, "--cursor"
      ]);
      const cursorDir = path.join(tempDir, ".cursor", "rules");
      await checkDirectoryExists(cursorDir);
      const mdcFile = path.join(cursorDir, "rules.mdc");

      // Get the content from the remote windsurf rules file
      const windsurfContent = await fetchContent(`${rawContentBase}/windsurffile/.windsurfrules`);
      
      // According to createDirectoryFromFile in converter.ts, 
      // the MDC file should have the content and the MDC files config header
      const expectedContent = `---
alwaysApply: true
---

${windsurfContent}`;
      
      await checkFileContent(mdcFile, expectedContent);
    });

    it("should convert from cursor directory to windsurf file", async () => {
        await program.parseAsync([
            "node", "rules", "install", `${repoBase}/cursorfolder`, "--windsurf"
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
    });

    it("should fail for invalid repository subfolder path", async () => {
        let errorCaught = false;
        try {
            await program.parseAsync([
                "node", "rules", "install", "hiddentao/rules/test/data/invalidpath"
            ]);
        } catch (e: any) {
            errorCaught = true;
            // Check if the error is due to process.exit being called (our mock throws)
            expect(e.message).to.equal("process.exit called");
            
            // Extract stderr output and check for specific error message
            const stderrOutput = stderrSpy.mock.calls.flat().join('');
            expect(stderrOutput).to.include("Error fetching repository contents");
        }
        expect(errorCaught, "Expected an error but none was caught").to.be.true;
    });

    it("should fail if valid path contains no rules", async () => {
        let errorCaught = false;
        try {
            await program.parseAsync([
                "node", "rules", "install", "hiddentao/rules/src" // Valid path, no rules
            ]);
        } catch (e: any) {
            errorCaught = true;
            expect(e.message).to.equal("process.exit called");
            
            // Extract stderr output and check for specific error message
            const stderrOutput = stderrSpy.mock.calls.flat().join('');
            expect(stderrOutput).to.include("No rules found");
        }
        expect(errorCaught, "Expected an error but none was caught").to.be.true;
    });
  });
}); 