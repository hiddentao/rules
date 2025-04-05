/**
 * Enum representing different rule types
 */
export enum RuleType {
  CURSOR_RULES = "cursor_rules",
  CURSOR_RULES_FILE = "cursorrules",
  WINDSURF_RULES_FILE = "windsurfrules",
}

/**
 * Rule type information with paths and details
 */
export interface RuleTypeInfo {
  type: RuleType;
  path: string;
  isDirectory: boolean;
}

/**
 * Options for rule selection
 */
export interface RuleSelectionOptions {
  cursor?: boolean;
  windsurf?: boolean;
}

/**
 * Conversion result with output path and whether conversion was performed
 */
export interface ConversionResult {
  outputPath: string;
  converted: boolean;
  fromType: RuleType;
  toType: RuleType;
}

/**
 * Type for repository path parsing results
 */
export interface RepoPathInfo {
  owner: string;
  repo: string;
  path?: string;
} 