import { pathExists } from "../github/client";
import { logger } from "../utils/logger";

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
 * Constants for rule paths
 */
const RULE_PATHS = {
  [RuleType.CURSOR_RULES]: ".cursor/rules",
  [RuleType.CURSOR_RULES_FILE]: ".cursorrules",
  [RuleType.WINDSURF_RULES_FILE]: ".windsurfrules",
};

/**
 * Order of precedence for rule types
 */
export const RULE_PRECEDENCE = [
  RuleType.CURSOR_RULES,
  RuleType.CURSOR_RULES_FILE,
  RuleType.WINDSURF_RULES_FILE,
];

/**
 * Detect available rule types in a repository
 */
export async function detectRuleTypes(
  owner: string,
  repo: string,
  basePath = ""
): Promise<RuleTypeInfo[]> {
  const ruleTypes: RuleTypeInfo[] = [];
  const prefix = basePath ? `${basePath}/` : "";

  logger.verbose(
    `Detecting rule types in ${owner}/${repo}${basePath ? `/${basePath}` : ""}`
  );

  // Check for cursor rules directory
  const cursorRulesPath = `${prefix}${RULE_PATHS[RuleType.CURSOR_RULES]}`;
  if (await pathExists(owner, repo, cursorRulesPath)) {
    logger.verbose(`Found ${RuleType.CURSOR_RULES} at ${cursorRulesPath}`);
    ruleTypes.push({
      type: RuleType.CURSOR_RULES,
      path: cursorRulesPath,
      isDirectory: true,
    });
  }

  // Check for cursor rules file
  const cursorRulesFilePath = `${prefix}${
    RULE_PATHS[RuleType.CURSOR_RULES_FILE]
  }`;
  if (await pathExists(owner, repo, cursorRulesFilePath)) {
    logger.verbose(
      `Found ${RuleType.CURSOR_RULES_FILE} at ${cursorRulesFilePath}`
    );
    ruleTypes.push({
      type: RuleType.CURSOR_RULES_FILE,
      path: cursorRulesFilePath,
      isDirectory: false,
    });
  }

  // Check for windsurf rules file
  const windsurfRulesPath = `${prefix}${RULE_PATHS[RuleType.WINDSURF_RULES_FILE]}`;
  if (await pathExists(owner, repo, windsurfRulesPath)) {
    logger.verbose(`Found ${RuleType.WINDSURF_RULES_FILE} at ${windsurfRulesPath}`);
    ruleTypes.push({
      type: RuleType.WINDSURF_RULES_FILE,
      path: windsurfRulesPath,
      isDirectory: false,
    });
  }

  return ruleTypes;
}

/**
 * Select rule type based on precedence when multiple types exist
 */
export function selectRuleTypeByPrecedence(
  ruleTypes: RuleTypeInfo[]
): RuleTypeInfo | null {
  if (ruleTypes.length === 0) {
    return null;
  }

  // Sort by precedence order
  const sortedRuleTypes = [...ruleTypes].sort((a, b) => {
    const aPrecedence = RULE_PRECEDENCE.indexOf(a.type);
    const bPrecedence = RULE_PRECEDENCE.indexOf(b.type);
    return aPrecedence - bPrecedence;
  });

  return sortedRuleTypes[0];
}
