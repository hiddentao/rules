import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { LogLevel, logger } from "../../src/utils/logger";

describe("Logger", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = spyOn(console, "log");
    consoleErrorSpy = spyOn(console, "error");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should log info messages", () => {
    logger.setLevel(LogLevel.INFO);
    logger.info("test info");
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should log success messages", () => {
    logger.setLevel(LogLevel.INFO);
    logger.success("test success");
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should log warning messages", () => {
    logger.setLevel(LogLevel.WARN);
    logger.warn("test warning");
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("should log error messages", () => {
    logger.setLevel(LogLevel.ERROR);
    logger.error("test error");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should not log debug messages when level is INFO", () => {
    logger.setLevel(LogLevel.INFO);
    logger.debug("test debug");
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("should log debug messages when level is DEBUG", () => {
    logger.setLevel(LogLevel.DEBUG);
    logger.debug("test debug");
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
