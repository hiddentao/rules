/**
 * Enum representing different rule types
 */
export enum RuleType {
  CURSOR_RULES = "cursor_rules_folder",
  CURSOR_RULES_FILE = "cursor_rules_file",
  WINDSURF_RULES_FILE = "windsurf_rules_file",
}

/**
 * Rule type information with paths and details
 */
export interface RuleTypeInfo {
  type: RuleType;
  path: string;
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