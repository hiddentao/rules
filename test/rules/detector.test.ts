import { describe, expect, it } from "bun:test";
import { RuleType, selectRuleTypeByPrecedence } from "../../src/rules/detector";
import type { RuleTypeInfo } from "../../src/rules/detector";

describe("Rule Detector", () => {
  describe("selectRuleTypeByPrecedence", () => {
    it("should return null for empty array", () => {
      const result = selectRuleTypeByPrecedence([]);
      expect(result).toBeNull();
    });

    it("should return the only rule type when array has one item", () => {
      const ruleTypes: RuleTypeInfo[] = [
        { type: RuleType.WINDSURF_RULES_FILE, path: ".windsurfrules", isDirectory: false },
      ];
      
      const result = selectRuleTypeByPrecedence(ruleTypes);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(RuleType.WINDSURF_RULES_FILE);
    });

    it("should select rule type based on precedence order", () => {
      const ruleTypes: RuleTypeInfo[] = [
        { type: RuleType.WINDSURF_RULES_FILE, path: ".windsurfrules", isDirectory: false },
        { type: RuleType.CURSOR_RULES, path: ".cursor/rules", isDirectory: true },
        { type: RuleType.CURSOR_RULES_FILE, path: ".cursorrules", isDirectory: false },
      ];
      
      const result = selectRuleTypeByPrecedence(ruleTypes);
      expect(result).not.toBeNull();
      expect(result?.type).toBe(RuleType.CURSOR_RULES);
    });
  });

  // Note: API-based tests would be implemented as end-to-end tests with mocks for detectRuleTypes
}); 