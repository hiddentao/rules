#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { version } from "../package.json";

// Create the main program
const program = new Command();

program
  .name("rules")
  .description("CLI tool for managing Cursor rules")
  .version(version);

// Add commands here as they are implemented
// e.g., program.addCommand(require('./commands/someCommand').default);

// Error handling for unhandled promises
process.on("unhandledRejection", (error) => {
  console.error(pc.red(`Unhandled error: ${error}`));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
