import { Command } from "commander";
import { parseRepoPath, validateRepository } from "../github/client";
import { detectRuleTypes } from "../rules/detector";
import { selectRuleType } from "../rules/selector";
import { RulesError } from "../utils/errors";
import { logger } from "../utils/logger";

interface InstallCommandOptions {
  cursor: boolean;
  windsurf: boolean;
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

      // Select rule type based on options or interactive prompt
      const selectedRuleType = await selectRuleType(ruleTypes, {
        preferCursor: options.cursor,
        preferWindsurf: options.windsurf,
      });

      if (!selectedRuleType) {
        throw new RulesError("No rule type selected");
      }

      logger.info(`Selected rule type: ${selectedRuleType.type}`);

      // TODO: Implement file downloading and conversion in Phase 3
      logger.success("Rule detection successful!");
      logger.info(`Path: ${selectedRuleType.path}`);
      logger.info(`Type: ${selectedRuleType.type}`);
      logger.info(`Is Directory: ${selectedRuleType.isDirectory}`);
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
