import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from "bun:test";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect } from "chai";
import { convertRules, getTargetRuleType } from "../src/rules/converter";
import { RuleType } from "../src/utils/types";

describe("Rule Converter", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(tmpdir(), `rules-test-${Math.random()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("getTargetRuleType", () => {
    it("should return the same type when no preference is specified", () => {
      expect(getTargetRuleType(RuleType.CURSOR_RULES)).to.equal(RuleType.CURSOR_RULES);
      expect(getTargetRuleType(RuleType.CURSOR_RULES_FILE)).to.equal(RuleType.CURSOR_RULES_FILE);
      expect(getTargetRuleType(RuleType.WINDSURF_RULES_FILE)).to.equal(RuleType.WINDSURF_RULES_FILE);
    });

    it("should return CURSOR_RULES when cursor is true and source is not CURSOR_RULES", () => {
      expect(getTargetRuleType(RuleType.CURSOR_RULES_FILE, true, false)).to.equal(RuleType.CURSOR_RULES);
      expect(getTargetRuleType(RuleType.WINDSURF_RULES_FILE, true, false)).to.equal(RuleType.CURSOR_RULES);
    });

    it("should not change type when cursor is true and source is already CURSOR_RULES", () => {
      expect(getTargetRuleType(RuleType.CURSOR_RULES, true, false)).to.equal(RuleType.CURSOR_RULES);
    });

    it("should return WINDSURF_RULES_FILE when windsurf is true and source is not WINDSURF_RULES_FILE", () => {
      expect(getTargetRuleType(RuleType.CURSOR_RULES, false, true)).to.equal(RuleType.WINDSURF_RULES_FILE);
      expect(getTargetRuleType(RuleType.CURSOR_RULES_FILE, false, true)).to.equal(RuleType.WINDSURF_RULES_FILE);
    });

    it("should not change type when windsurf is true and source is already WINDSURF_RULES_FILE", () => {
      expect(getTargetRuleType(RuleType.WINDSURF_RULES_FILE, false, true)).to.equal(RuleType.WINDSURF_RULES_FILE);
    });

    it("should prioritize cursor over windsurf when both are true", () => {
      expect(getTargetRuleType(RuleType.WINDSURF_RULES_FILE, true, true)).to.equal(RuleType.CURSOR_RULES);
    });
  });

  describe("convertRules", () => {
    it("should not convert when source and target types are the same", async () => {
      // Setup a test file
      const sourcePath = path.join(tempDir, "test-source.txt");
      await fs.writeFile(sourcePath, "test content", "utf-8");

      const result = await convertRules(
        sourcePath,
        RuleType.CURSOR_RULES_FILE,
        RuleType.CURSOR_RULES_FILE,
        tempDir
      );

      expect(result.converted).to.be.false;
      expect(result.outputPath).to.equal(sourcePath);
      expect(result.fromType).to.equal(RuleType.CURSOR_RULES_FILE);
      expect(result.toType).to.equal(RuleType.CURSOR_RULES_FILE);
    });

    it("should convert from file to directory with MDC files config", async () => {
      // Setup a test file
      const sourcePath = path.join(tempDir, "test-file.txt");
      await fs.writeFile(sourcePath, "test content", "utf-8");

      const result = await convertRules(
        sourcePath,
        RuleType.CURSOR_RULES_FILE,
        RuleType.CURSOR_RULES,
        tempDir
      );

      expect(result.converted).to.be.true;
      expect(result.outputPath).to.equal(path.join(tempDir, ".cursor", "rules"));
      expect(result.fromType).to.equal(RuleType.CURSOR_RULES_FILE);
      expect(result.toType).to.equal(RuleType.CURSOR_RULES);

      // Check if MDC files config is set
      const outputContent = await fs.readFile(
        path.join(tempDir, ".cursor", "rules", "rules.mdc"),
        "utf-8"
      );
      expect(outputContent).to.equal(`---
alwaysApply: true
---

test content`);
    });

    it("should convert between file types", async () => {
      // Setup a test file
      const sourcePath = path.join(tempDir, "test-cursorrules.txt");
      await fs.writeFile(sourcePath, "test content", "utf-8");

      const result = await convertRules(
        sourcePath,
        RuleType.CURSOR_RULES_FILE,
        RuleType.WINDSURF_RULES_FILE,
        tempDir
      );

      expect(result.converted).to.be.true;
      expect(result.outputPath).to.equal(path.join(tempDir, ".windsurfrules"));
      expect(result.fromType).to.equal(RuleType.CURSOR_RULES_FILE);
      expect(result.toType).to.equal(RuleType.WINDSURF_RULES_FILE);

      // Check content
      const outputContent = await fs.readFile(
        path.join(tempDir, ".windsurfrules"),
        "utf-8"
      );
      expect(outputContent).to.equal("test content");
    });

    it("should convert from directory to CURSOR_RULES_FILE", async () => {
      // Setup a test directory with multiple files
      const sourceDir = path.join(tempDir, ".cursor", "rules");
      await fs.mkdir(sourceDir, { recursive: true });
      
      await fs.writeFile(path.join(sourceDir, "file1.mdc"), "rule content 1", "utf-8");
      await fs.writeFile(path.join(sourceDir, "file2.mdc"), "rule content 2", "utf-8");
      
      const result = await convertRules(
        sourceDir,
        RuleType.CURSOR_RULES,
        RuleType.CURSOR_RULES_FILE,
        tempDir
      );

      expect(result.converted).to.be.true;
      expect(result.outputPath).to.equal(path.join(tempDir, ".cursorrules"));
      expect(result.fromType).to.equal(RuleType.CURSOR_RULES);
      expect(result.toType).to.equal(RuleType.CURSOR_RULES_FILE);

      // Check content - should concatenate the files in alphabetical order
      const outputContent = await fs.readFile(
        path.join(tempDir, ".cursorrules"),
        "utf-8"
      );
      const expectedContent = `# File: file1.mdc

rule content 1

# File: file2.mdc

rule content 2`;
      expect(outputContent).to.equal(expectedContent);
    });

    it("should convert from directory to WINDSURF_RULES_FILE", async () => {
      // Setup a test directory with multiple files including subdirectories
      const sourceDir = path.join(tempDir, ".cursor", "rules");
      const subDir = path.join(sourceDir, "subdir");
      await fs.mkdir(subDir, { recursive: true });
      
      await fs.writeFile(path.join(sourceDir, "main.mdc"), "main rule", "utf-8");
      await fs.writeFile(path.join(subDir, "nested.mdc"), "nested rule", "utf-8");
      
      const result = await convertRules(
        sourceDir,
        RuleType.CURSOR_RULES,
        RuleType.WINDSURF_RULES_FILE,
        tempDir
      );

      expect(result.converted).to.be.true;
      expect(result.outputPath).to.equal(path.join(tempDir, ".windsurfrules"));
      expect(result.fromType).to.equal(RuleType.CURSOR_RULES);
      expect(result.toType).to.equal(RuleType.WINDSURF_RULES_FILE);

      // Check content - files should be concatenated with headers
      const outputContent = await fs.readFile(
        path.join(tempDir, ".windsurfrules"),
        "utf-8"
      );
      const expectedContent = `# File: main.mdc

main rule

# File: subdir/nested.mdc

nested rule`;
      expect(outputContent).to.equal(expectedContent);
    });
  });
}); 