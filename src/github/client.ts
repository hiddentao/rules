import * as fs from "node:fs/promises";
import * as path from "node:path";
import simpleGit from "simple-git";
import tmp from "tmp";
import { GITHUB } from "../utils/constants";
import { RulesError } from "../utils/errors";
import type { RepoPathInfo } from "../utils/types";

// Repository cache with expiration
interface RepoCacheEntry {
  dir: string;
  timestamp: number;
}

const repoCache: Map<string, RepoCacheEntry> = new Map();

/**
 * Parse GitHub repository path from command line input
 * Supports formats:
 * - user/repo
 * - user/repo/path/to/subfolder
 */
export function parseRepoPath(repoPath: string): RepoPathInfo {
  const parts = repoPath.split("/");

  if (parts.length < 2) {
    throw new RulesError(
      "Invalid repository path format. Use 'user/repo' or 'user/repo/path/to/subfolder'"
    );
  }

  const owner = parts[0];
  const repo = parts[1];
  const path = parts.length > 2 ? parts.slice(2).join("/") : undefined;

  return { owner, repo, path };
}

/**
 * Create a temporary directory that auto-removes on process exit
 */
function createTempDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    tmp.dir({ unsafeCleanup: true }, (err, path) => {
      if (err) reject(err);
      else resolve(path);
    });
  });
}

/**
 * Get a cached repository or clone a new one
 */
async function getRepository(owner: string, repo: string): Promise<string> {
  const cacheKey = `${owner}/${repo}`;
  const now = Date.now();
  const cachedRepo = repoCache.get(cacheKey);
  
  // Return cached repo if it exists and hasn't expired
  if (cachedRepo && (now - cachedRepo.timestamp) < GITHUB.REPO_CACHE_EXPIRY_MS) {
    return cachedRepo.dir;
  }
  
  // Create new temp directory and clone repo
  const targetDir = await createTempDir();
  await cloneRepositoryImpl(owner, repo, targetDir);
  
  // Cache the newly cloned repo
  repoCache.set(cacheKey, { dir: targetDir, timestamp: now });
  
  return targetDir;
}

/**
 * Implementation of repository cloning
 */
async function cloneRepositoryImpl(
  owner: string,
  repo: string,
  targetDir: string
): Promise<void> {
  const repoUrl = `https://github.com/${owner}/${repo}.git`;
  const git = simpleGit();
  
  try {
    await git.clone(repoUrl, targetDir, ["--depth", "1"]);
  } catch (error) {
    throw new RulesError(
      `Failed to clone repository ${owner}/${repo}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Checks if a path exists in the repository using the local clone
 */
export async function pathExists(
  owner: string,
  repo: string,
  filePath: string,
  isDirectory = false
): Promise<boolean> {
  try {
    const repoDir = await getRepository(owner, repo);
    const fullPath = path.join(repoDir, filePath);
    const stats = await fs.stat(fullPath).catch(() => null);
    
    if (!stats) {
      return false;
    }
    
    return isDirectory ? stats.isDirectory() : stats.isFile();
  } catch (error) {
    if (error instanceof RulesError && error.message.includes("Failed to clone")) {
      return false;
    }
    throw error;
  }
}

/**
 * Gets contents of a file from GitHub using local clone
 */
export async function getFileContents(
  owner: string,
  repo: string,
  filePath: string
): Promise<string> {
  try {
    const repoDir = await getRepository(owner, repo);
    const fullPath = path.join(repoDir, filePath);
    return await fs.readFile(fullPath, 'utf-8');
  } catch (error) {
    throw new RulesError(
      `Error reading file ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Gets contents of a directory from GitHub by using local clone
 */
export async function getDirectoryContents(
  owner: string,
  repo: string,
  dirPath: string
): Promise<Array<{ name: string; path: string; type: string }>> {
  try {
    const repoDir = await getRepository(owner, repo);
    const fullPath = path.join(repoDir, dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    return entries.map(entry => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      type: entry.isDirectory() ? "dir" : "file"
    }));
  } catch (error) {
    throw new RulesError(
      `Error reading directory ${dirPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Validates that a repository exists by attempting to clone it
 */
export async function validateRepository(
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await getRepository(owner, repo);
    return true;
  } catch (error) {
    if (error instanceof RulesError && error.message.includes("Failed to clone")) {
      throw new RulesError(`Repository not found: ${owner}/${repo}`);
    }
    throw error;
  }
}
