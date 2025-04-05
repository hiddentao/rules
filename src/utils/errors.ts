import { logger } from "./logger";

// Custom error types
export class RulesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RulesError";
  }
}

export class ValidationError extends RulesError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiError extends RulesError {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

export class FileSystemError extends RulesError {
  constructor(message: string) {
    super(message);
    this.name = "FileSystemError";
  }
}

// Error handling function
export function handleError(error: unknown): never {
  if (error instanceof RulesError) {
    logger.error(error.message);
  } else if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`, error);
  } else {
    logger.error(`Unknown error: ${String(error)}`);
  }

  process.exit(1);
}
