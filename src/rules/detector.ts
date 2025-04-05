import { pathExists } from "../github/client";
import { RULE_IS_DIRECTORY, RULE_PATHS } from "../utils/constants";
import { logger } from "../utils/logger";
import { RuleType } from "../utils/types";
import type { RuleTypeInfo } from "../utils/types";

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

  // Check for each rule type
  for (const ruleType of Object.values(RuleType)) {
    const typedRuleType = ruleType as RuleType;
    const rulePath = `${prefix}${RULE_PATHS[typedRuleType]}`;
    const isDirectory = RULE_IS_DIRECTORY[typedRuleType];
    if (await pathExists(owner, repo, rulePath, isDirectory)) {
      logger.verbose(`Found ${typedRuleType} at ${rulePath}`);
      ruleTypes.push({
        type: typedRuleType,
        path: rulePath,
      });
    }
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
