import { RuleType } from "./types";

/**
 * Constants for rule paths
 */
export const RULE_PATHS: Record<RuleType, string> = {
  [RuleType.CURSOR_RULES]: ".cursor/rules",
  [RuleType.CURSOR_RULES_FILE]: ".cursorrules",
  [RuleType.WINDSURF_RULES_FILE]: ".windsurfrules",
};

/**
 * Indicates whether a rule type is a directory or file
 */
export const RULE_IS_DIRECTORY: Record<RuleType, boolean> = {
  [RuleType.CURSOR_RULES]: true,
  [RuleType.CURSOR_RULES_FILE]: false,
  [RuleType.WINDSURF_RULES_FILE]: false,
};

/**
 * Friendly display names for rule types
 */
export const RULE_TYPE_DISPLAY_NAMES: Record<RuleType, string> = {
  [RuleType.CURSOR_RULES]: `Cursor Rules Directory (${RULE_PATHS[RuleType.CURSOR_RULES]})`,
  [RuleType.CURSOR_RULES_FILE]: `Cursor Rules File (${RULE_PATHS[RuleType.CURSOR_RULES_FILE]})`,
  [RuleType.WINDSURF_RULES_FILE]: `Windsurf Rules File (${RULE_PATHS[RuleType.WINDSURF_RULES_FILE]})`,
};

/**
 * GitHub client constants
 */
export const GITHUB = {
  /**
   * Repository cache expiration time (in milliseconds)
   */
  REPO_CACHE_EXPIRY_MS: 60 * 1000, // 60 seconds
}; 