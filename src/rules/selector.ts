import inquirer from "inquirer";
import { logger } from "../utils/logger";
import { RuleType, selectRuleTypeByPrecedence } from "./detector";
import type { RuleTypeInfo } from "./detector";

/**
 * Options for rule selection
 */
export interface RuleSelectionOptions {
  preferCursor?: boolean;
  preferWindsurf?: boolean;
}

/**
 * Friendly display names for rule types
 */
const RULE_TYPE_DISPLAY_NAMES = {
  [RuleType.CURSOR_RULES]: "Cursor Rules Directory (.cursor/rules)",
  [RuleType.CURSOR_RULES_FILE]: "Cursor Rules File (.cursorrules)",
  [RuleType.WINDSURF_RULES_FILE]: "Windsurf Rules File (.windsurfrules)",
};

/**
 * Select rule type based on options and available rule types
 */
export async function selectRuleType(
  ruleTypes: RuleTypeInfo[],
  options: RuleSelectionOptions = {}
): Promise<RuleTypeInfo | null> {
  if (ruleTypes.length === 0) {
    return null;
  }

  if (ruleTypes.length === 1) {
    logger.info(
      `Only one rule type found: ${RULE_TYPE_DISPLAY_NAMES[ruleTypes[0].type]}`
    );
    return ruleTypes[0];
  }

  // Check for preferred rule types
  if (options.preferCursor) {
    const cursorRulesDir = ruleTypes.find(
      (r) => r.type === RuleType.CURSOR_RULES
    );
    if (cursorRulesDir) {
      logger.info("Selected Cursor Rules Directory based on --cursor flag.");
      return cursorRulesDir;
    }

    const cursorRulesFile = ruleTypes.find(
      (r) => r.type === RuleType.CURSOR_RULES_FILE
    );
    if (cursorRulesFile) {
      logger.info("Selected Cursor Rules File based on --cursor flag.");
      return cursorRulesFile;
    }

    logger.info("No Cursor rules found, selecting based on precedence.");
    return selectRuleTypeByPrecedence(ruleTypes);
  }

  if (options.preferWindsurf) {
    const windsurfRules = ruleTypes.find(
      (r) => r.type === RuleType.WINDSURF_RULES_FILE
    );
    if (windsurfRules) {
      logger.info("Selected Windsurf Rules File based on --windsurf flag.");
      return windsurfRules;
    }

    logger.info("No Windsurf rules found, selecting based on precedence.");
    return selectRuleTypeByPrecedence(ruleTypes);
  }

  // Interactive selection
  logger.info("Multiple rule types found. Please select which one to use:");

  const choices = ruleTypes.map((ruleType) => ({
    name: RULE_TYPE_DISPLAY_NAMES[ruleType.type],
    value: ruleType,
  }));

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "ruleType",
      message: "Select which rule type to install:",
      choices,
    },
  ]);

  return answers.ruleType;
}
