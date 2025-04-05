import { RulesError } from "../utils/errors";

/**
 * Type for repository path parsing results
 */
export interface RepoPathInfo {
  owner: string;
  repo: string;
  path?: string;
}

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
 */
async function fetchGitHub(
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
 * Checks if a path exists in the repository
 */
export async function pathExists(
  owner: string,
  repo: string,
  path: string
): Promise<boolean> {
  try {
    await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    );
    return true;
  } catch (error) {
    if (error instanceof RulesError && error.message.includes("not found")) {
      return false;
    }
    throw error;
  }
}

/**
 * Gets contents of a file from GitHub
 */
export async function getFileContents(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const data = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  );

  if (data.type !== "file") {
    throw new RulesError(`Path is not a file: ${path}`);
  }

  if (!data.content) {
    throw new RulesError(`No content found for file: ${path}`);
  }

  // GitHub API returns content as base64 encoded
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/**
 * Gets contents of a directory from GitHub
 */
export async function getDirectoryContents(
  owner: string,
  repo: string,
  path: string
): Promise<Array<{ name: string; path: string; type: string }>> {
  const data = await fetchGitHub(
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
 * Validates that a repository exists
 */
export async function validateRepository(
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await fetchGitHub(`https://api.github.com/repos/${owner}/${repo}`);
    return true;
  } catch (error) {
    if (error instanceof RulesError && error.message.includes("not found")) {
      throw new RulesError(`Repository not found: ${owner}/${repo}`);
    }
    throw error;
  }
}
