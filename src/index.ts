#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { version } from "../package.json";
import installCommand from "./commands/install";

// Create the main program
const program = new Command();

program
  .name("rules")
  .description("Install rules for Cursor/Windsurf/etc")
  .version(version);

// Add commands
program.addCommand(installCommand);

// Error handling for unhandled promises
process.on("unhandledRejection", (error) => {
  console.error(pc.red(`Unhandled error: ${error}`));
  process.exit(1);
});

// Only parse args and potentially show help if running as main script
if (import.meta.main) {
  // Parse command line arguments
  program.parse(process.argv);

  // Display help if no command is provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

export default program;
