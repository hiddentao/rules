import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import {
  ApiError,
  FileSystemError,
  RulesError,
  ValidationError,
  handleError,
} from "../../src/utils/errors";
import { logger } from "../../src/utils/logger";

describe("Error Classes", () => {
  it("should create RulesError with correct name", () => {
    const error = new RulesError("Test error");
    expect(error.name).toBe("RulesError");
    expect(error.message).toBe("Test error");
  });

  it("should create ValidationError with correct name", () => {
    const error = new ValidationError("Test validation error");
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Test validation error");
    expect(error instanceof RulesError).toBe(true);
  });

  it("should create ApiError with correct name and status code", () => {
    const error = new ApiError("Test API error", 404);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Test API error");
    expect(error.statusCode).toBe(404);
    expect(error instanceof RulesError).toBe(true);
  });

  it("should create FileSystemError with correct name", () => {
    const error = new FileSystemError("Test file system error");
    expect(error.name).toBe("FileSystemError");
    expect(error.message).toBe("Test file system error");
    expect(error instanceof RulesError).toBe(true);
  });
});

describe("handleError", () => {
  let processExitSpy: any;
  let loggerErrorSpy: any;

  beforeEach(() => {
    processExitSpy = spyOn(process, "exit").mockImplementation(
      (() => {}) as any
    );
    loggerErrorSpy = spyOn(logger, "error");
  });

  afterEach(() => {
    processExitSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it("should handle RulesError correctly", () => {
    try {
      handleError(new RulesError("Rules error"));
    } catch {}

    expect(loggerErrorSpy).toHaveBeenCalledWith("Rules error");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle regular Error correctly", () => {
    try {
      handleError(new Error("Regular error"));
    } catch {}

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      "Unexpected error: Regular error",
      expect.any(Error)
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("should handle non-Error objects correctly", () => {
    try {
      handleError("String error");
    } catch {}

    expect(loggerErrorSpy).toHaveBeenCalledWith("Unknown error: String error");
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
