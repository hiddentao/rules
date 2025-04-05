import fs from "node:fs/promises";
import path from "node:path";
import { RULE_PATHS } from "../utils/constants";
import { RulesError } from "../utils/errors";
import { logger } from "../utils/logger";
import { RuleType } from "../utils/types";
import type { ConversionResult, RuleTypeInfo } from "../utils/types";

/**
 * Reads all files from a directory recursively
 */
async function readDirectory(
  dir: string,
  baseDir: string = dir
): Promise<{ relativePath: string; content: string }[]> {
  const result: { relativePath: string; content: string }[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const subDirFiles = await readDirectory(fullPath, baseDir);
      result.push(...subDirFiles);
    } else {
      const content = await fs.readFile(fullPath, "utf-8");
      result.push({ relativePath, content });
    }
  }

  return result;
}

/**
 * Concatenates all files from a directory into a single string
 */
async function concatenateDirectoryFiles(dirPath: string): Promise<string> {
  const files = await readDirectory(dirPath);
  
  // Sort files to ensure consistent output
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  
  let result = "";
  
  for (const file of files) {
    result += `\n# File: ${file.relativePath}\n\n${file.content}\n`;
  }
  
  return result.trim();
}

/**
 * Creates directory structure from a single file
 * Sets MDC files config to "always attached"
 */
async function createDirectoryFromFile(
  filePath: string,
  outputDir: string
): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8");
  
  await fs.mkdir(outputDir, { recursive: true });
  
  // Create rules.mdc with the content and MDC files config
  const outputPath = path.join(outputDir, "rules.mdc");
  const outputContent = `---
alwaysApply: true
---

${content}`;
  
  await fs.writeFile(outputPath, outputContent, "utf-8");
}

/**
 * Converts rule set from one format to another
 */
export async function convertRules(
  sourcePath: string,
  sourceType: RuleType,
  targetType: RuleType,
  localDir = "."
): Promise<ConversionResult> {
  if (sourceType === targetType) {
    return {
      outputPath: sourcePath,
      converted: false,
      fromType: sourceType,
      toType: targetType,
    };
  }
  
  logger.info(`Converting rules from ${sourceType} to ${targetType}`);
  
  let outputPath: string;
  
  try {
    // Convert from directory to file
    if (
      sourceType === RuleType.CURSOR_RULES &&
      (targetType === RuleType.CURSOR_RULES_FILE ||
        targetType === RuleType.WINDSURF_RULES_FILE)
    ) {
      const content = await concatenateDirectoryFiles(sourcePath);
      
      if (targetType === RuleType.CURSOR_RULES_FILE) {
        outputPath = path.join(localDir, RULE_PATHS[RuleType.CURSOR_RULES_FILE]);
      } else {
        outputPath = path.join(localDir, RULE_PATHS[RuleType.WINDSURF_RULES_FILE]);
      }
      
      await fs.writeFile(outputPath, content, "utf-8");
    }
    // Convert from file to directory
    else if (
      (sourceType === RuleType.CURSOR_RULES_FILE ||
        sourceType === RuleType.WINDSURF_RULES_FILE) &&
      targetType === RuleType.CURSOR_RULES
    ) {
      outputPath = path.join(localDir, RULE_PATHS[RuleType.CURSOR_RULES]);
      await createDirectoryFromFile(sourcePath, outputPath);
    }
    // Convert between file types (simple rename)
    else if (
      (sourceType === RuleType.CURSOR_RULES_FILE &&
        targetType === RuleType.WINDSURF_RULES_FILE) ||
      (sourceType === RuleType.WINDSURF_RULES_FILE &&
        targetType === RuleType.CURSOR_RULES_FILE)
    ) {
      const content = await fs.readFile(sourcePath, "utf-8");
      
      if (targetType === RuleType.CURSOR_RULES_FILE) {
        outputPath = path.join(localDir, RULE_PATHS[RuleType.CURSOR_RULES_FILE]);
      } else {
        outputPath = path.join(localDir, RULE_PATHS[RuleType.WINDSURF_RULES_FILE]);
      }
      
      await fs.writeFile(outputPath, content, "utf-8");
    } else {
      throw new RulesError(
        `Unsupported conversion: ${sourceType} to ${targetType}`
      );
    }
    
    logger.success(`Rules converted successfully to ${outputPath}`);
    
    return {
      outputPath,
      converted: true,
      fromType: sourceType,
      toType: targetType,
    };
  } catch (error) {
    throw new RulesError(
      `Failed to convert rules from ${sourceType} to ${targetType}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Determines the target rule type based on options
 */
export function getTargetRuleType(
  sourceType: RuleType,
  cursor = false,
  windsurf = false
): RuleType {
  if (cursor) {
    if (sourceType !== RuleType.CURSOR_RULES) {
      return RuleType.CURSOR_RULES;
    }
  } else if (windsurf) {
    if (sourceType !== RuleType.WINDSURF_RULES_FILE) {
      return RuleType.WINDSURF_RULES_FILE;
    }
  }
  
  return sourceType;
} 