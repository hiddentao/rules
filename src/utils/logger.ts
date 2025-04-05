import pc from "picocolors";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(pc.gray(message));
    }
  }

  verbose(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(pc.gray(`[verbose] ${message}`));
    }
  }

  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(pc.white(message));
    }
  }

  success(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(pc.green(message));
    }
  }

  warn(message: string): void {
    if (this.level <= LogLevel.WARN) {
      console.log(pc.yellow(message));
    }
  }

  error(message: string, err?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(pc.red(message));
      if (err && this.level === LogLevel.DEBUG) {
        console.error(pc.red(err.stack || err.toString()));
      }
    }
  }

  // For displaying raw data without formatting
  raw(message: string): void {
    console.log(message);
  }
}

// Export a singleton instance
export const logger = new Logger();
