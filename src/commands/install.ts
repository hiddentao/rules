import { Command } from "commander";
import { parseRepoPath, validateRepository } from "../github/client";
import { convertRules, getTargetRuleType } from "../rules/converter";
import { detectRuleTypes } from "../rules/detector";
import { downloadRules } from "../rules/fileManager";
import { selectRuleType } from "../rules/selector";
import { RulesError } from "../utils/errors";
import { logger } from "../utils/logger";
import type { RuleSelectionOptions } from "../utils/types";

interface InstallCommandOptions extends RuleSelectionOptions {
  verbose: boolean;
}

export const installCommand = new Command("install")
  .description("Install IDE rules from a GitHub repository")
  .argument(
    "<repo-path>",
    "GitHub repository path (user/repo or user/repo/path)"
  )
  .option("-c, --cursor", "Prefer Cursor rules format")
  .option("-w, --windsurf", "Prefer Windsurf rules format")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (repoPathArg: string, options: InstallCommandOptions) => {
    try {
      // Enable verbose logging if requested
      if (options.verbose) {
        logger.setLevel(0); // Set to DEBUG level
      }

      logger.info(`Installing rules from: ${repoPathArg}`);
      logger.verbose("Parsing repository path...");

      // Parse repository path
      const { owner, repo, path } = parseRepoPath(repoPathArg);

      // Validate repository existence
      logger.verbose(`Validating repository: ${owner}/${repo}`);
      await validateRepository(owner, repo);

      // Detect available rule types
      logger.verbose("Detecting rule types...");
      const ruleTypes = await detectRuleTypes(owner, repo, path);

      if (ruleTypes.length === 0) {
        throw new RulesError("No rules found in the specified location");
      }

      // Map commander options to selection options
      const selectionOptions: RuleSelectionOptions = {
        cursor: options.cursor,
        windsurf: options.windsurf,
      };

      // Select rule type based on options or interactive prompt
      const selectedRuleType = await selectRuleType(ruleTypes, selectionOptions);

      if (!selectedRuleType) {
        throw new RulesError("No rule type selected");
      }

      logger.verbose(`Selected rule type: ${selectedRuleType.type}`);

      // Download the selected rules
      const downloadedPath = await downloadRules(
        owner,
        repo,
        selectedRuleType
      );

      // Determine target rule type for conversion (if needed)
      const targetRuleType = getTargetRuleType(
        selectedRuleType.type,
        options.cursor,
        options.windsurf
      );

      // Convert rules if needed
      if (targetRuleType !== selectedRuleType.type) {
        const result = await convertRules(
          downloadedPath,
          selectedRuleType.type,
          targetRuleType
        );

        if (result.converted) {
          logger.verbose(
            `Rules converted from ${result.fromType} to ${result.toType}`
          );
        }
      }

      logger.success("Rules installed successfully!");
    } catch (error) {
      if (error instanceof RulesError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error(`An unexpected error occurred: ${error.message}`, error);
      } else {
        logger.error(`An unknown error occurred: ${String(error)}`);
      }
      process.exit(1);
    }
  });

export default installCommand;
