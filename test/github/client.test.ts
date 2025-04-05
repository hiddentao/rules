import { describe, expect, it } from "bun:test";
import { parseRepoPath } from "../../src/github/client";
import { RulesError } from "../../src/utils/errors";

describe("GitHub Client", () => {
  describe("parseRepoPath", () => {
    it("should parse user/repo format correctly", () => {
      const result = parseRepoPath("user/repo");
      expect(result.owner).toBe("user");
      expect(result.repo).toBe("repo");
      expect(result.path).toBeUndefined();
    });

    it("should parse user/repo/path format correctly", () => {
      const result = parseRepoPath("user/repo/path/to/rules");
      expect(result.owner).toBe("user");
      expect(result.repo).toBe("repo");
      expect(result.path).toBe("path/to/rules");
    });

    it("should throw an error for invalid formats", () => {
      expect(() => parseRepoPath("invalid")).toThrow(RulesError);
    });
  });

  // Note: API-based tests would be implemented as end-to-end tests with mocks
}); 