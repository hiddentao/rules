import { RulesError } from "../utils/errors";
import type { RepoPathInfo } from "../utils/types";

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
 * Fetches content from GitHub API with error handling
 * Used only for directory contents
 */
async function fetchGitHubAPI(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "rules-cli-tool",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new RulesError(`GitHub resource not found: ${url}`);
      }

      const errorBody = await response.text();
      throw new RulesError(
        `GitHub API error (${response.status}): ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof RulesError) {
      throw error;
    }
    throw new RulesError(
      `Error fetching from GitHub: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Fetches raw content from GitHub with error handling
 */
async function fetchGitHubRaw(
  owner: string,
  repo: string,
  path: string,
  branch = "main"
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "rules-cli-tool",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new RulesError(`GitHub resource not found: ${url}`);
      }

      throw new RulesError(
        `GitHub error (${response.status}): ${response.statusText}`
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof RulesError) {
      throw error;
    }
    throw new RulesError(
      `Error fetching from GitHub: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Checks if a path exists in the repository using raw.githubusercontent.com for files
 * and GitHub API for folders
 */
export async function pathExists(
  owner: string,
  repo: string,
  path: string,
  isDirectory = false
): Promise<boolean> {
  try {
    if (isDirectory) {
      // Use GitHub API for directories
      await fetchGitHubAPI(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      );
    } else {
      // Use raw.githubusercontent.com for files
      await fetchGitHubRaw(owner, repo, path);
    }
    return true;
  } catch (error) {
    if (error instanceof RulesError && error.message.includes("not found")) {
      return false;
    }
    throw error;
  }
}

/**
 * Gets contents of a file from GitHub using raw.githubusercontent.com
 */
export async function getFileContents(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  return await fetchGitHubRaw(owner, repo, path);
}

/**
 * Gets contents of a directory from GitHub
 * Still uses GitHub API as there's no direct way to get directory listings from raw.githubusercontent.com
 */
export async function getDirectoryContents(
  owner: string,
  repo: string,
  path: string
): Promise<Array<{ name: string; path: string; type: string }>> {
  const data = await fetchGitHubAPI(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  );

  if (!Array.isArray(data)) {
    throw new RulesError(`Path is not a directory: ${path}`);
  }

  return data.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
  }));
}

/**
 * Validates that a repository exists by attempting to access its README file
 */
export async function validateRepository(
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    // Try to fetch the repository's landing page
    const response = await fetch(`https://github.com/${owner}/${repo}`, {
      headers: {
        "User-Agent": "rules-cli-tool",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new RulesError(`Repository not found: ${owner}/${repo}`);
      }
      throw new RulesError(
        `GitHub error (${response.status}): ${response.statusText}`
      );
    }
    
    return true;
  } catch (error) {
    if (error instanceof RulesError) {
      throw error;
    }
    throw new RulesError(
      `Error validating repository: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
