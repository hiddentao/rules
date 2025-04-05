import fs from "node:fs/promises";
import path from "node:path";
import { getDirectoryContents, getFileContents } from "../github/client";
import { RULE_IS_DIRECTORY, RULE_PATHS } from "../utils/constants";
import { RulesError } from "../utils/errors";
import { logger } from "../utils/logger";
import { RuleType } from "../utils/types";
import type { RuleTypeInfo } from "../utils/types";

/**
 * Creates a directory recursively if it doesn't exist
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.verbose(`Directory created/verified: ${dirPath}`);
  } catch (error) {
    throw new RulesError(
      `Failed to create directory ${dirPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Writes content to a file, creating parent directories if needed
 */
async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf-8");
    logger.verbose(`File written: ${filePath}`);
  } catch (error) {
    throw new RulesError(
      `Failed to write file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Downloads a file from GitHub and writes it to the local file system
 */
export async function downloadFile(
  owner: string,
  repo: string,
  remotePath: string,
  localPath: string
): Promise<void> {
  logger.verbose(`Downloading file: ${remotePath} to ${localPath}`);
  
  try {
    const content = await getFileContents(owner, repo, remotePath);
    await writeFile(localPath, content);
    logger.verbose(`File downloaded successfully: ${localPath}`);
  } catch (error) {
    throw new RulesError(
      `Failed to download file ${remotePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Downloads a directory recursively from GitHub and writes it to the local file system
 */
export async function downloadDirectory(
  owner: string,
  repo: string,
  remotePath: string,
  localPath: string
): Promise<void> {
  logger.verbose(`Downloading directory: ${remotePath} to ${localPath}`);
  
  try {
    await ensureDirectoryExists(localPath);
    
    const contents = await getDirectoryContents(owner, repo, remotePath);
    
    for (const item of contents) {
      const newRemotePath = item.path;
      const newLocalPath = path.join(localPath, item.name);
      
      if (item.type === "file") {
        await downloadFile(owner, repo, newRemotePath, newLocalPath);
      } else if (item.type === "dir") {
        await downloadDirectory(owner, repo, newRemotePath, newLocalPath);
      }
    }
    
    logger.verbose(`Directory downloaded successfully: ${localPath}`);
  } catch (error) {
    throw new RulesError(
      `Failed to download directory ${remotePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Downloads rules from GitHub to the local file system
 */
export async function downloadRules(
  owner: string,
  repo: string,
  ruleInfo: RuleTypeInfo,
  localDir = "."
): Promise<string> {
  logger.verbose(`Downloading ${ruleInfo.type} from ${owner}/${repo}`);
  
  let destinationPath: string;
  
  if (RULE_IS_DIRECTORY[ruleInfo.type]) {
    destinationPath = path.join(localDir, RULE_PATHS[RuleType.CURSOR_RULES]);
    await downloadDirectory(owner, repo, ruleInfo.path, destinationPath);
  } else {
    // For single files
    if (ruleInfo.type === RuleType.CURSOR_RULES_FILE) {
      destinationPath = path.join(localDir, RULE_PATHS[RuleType.CURSOR_RULES_FILE]);
    } else {
      destinationPath = path.join(localDir, RULE_PATHS[RuleType.WINDSURF_RULES_FILE]);
    }
    
    await downloadFile(owner, repo, ruleInfo.path, destinationPath);
  }
  
  logger.info(`Downloaded rules to ${destinationPath}`);
  return destinationPath;
} 