import { describe, expect, it } from "vitest";
import { GraphQLError } from "graphql";
import {
  normalizeDueDate,
  sanitizeCardInput,
  validateMoveIndex,
} from "./auth";

describe("normalizeDueDate", () => {
  it("accepts valid YYYY-MM-DD dates", () => {
    expect(normalizeDueDate("2026-06-08")).toBe("2026-06-08");
  });

  it("clears null and empty values", () => {
    expect(normalizeDueDate(null)).toBeNull();
    expect(normalizeDueDate("")).toBeNull();
  });

  it("rejects invalid formats", () => {
    expect(() => normalizeDueDate("06/08/2026")).toThrow(GraphQLError);
    expect(() => normalizeDueDate("2026-13-01")).toThrow(GraphQLError);
    expect(() => normalizeDueDate("2026-02-30")).toThrow(GraphQLError);
  });
});

describe("validateMoveIndex", () => {
  it("accepts in-range indices for cross-column moves", () => {
    expect(validateMoveIndex(0, 3, false)).toBe(0);
    expect(validateMoveIndex(3, 3, false)).toBe(3);
  });

  it("accepts in-range indices for same-column moves", () => {
    expect(validateMoveIndex(2, 4, true)).toBe(2);
  });

  it("rejects negative and out-of-range indices", () => {
    expect(() => validateMoveIndex(-1, 3, false)).toThrow(GraphQLError);
    expect(() => validateMoveIndex(4, 3, false)).toThrow(GraphQLError);
    expect(() => validateMoveIndex(4, 4, true)).toThrow(GraphQLError);
  });
});

describe("sanitizeCardInput", () => {
  it("drops client-controlled assignee display fields", () => {
    const result = sanitizeCardInput({
      title: "Task",
      assigneeInitials: "CEO",
      assigneeColor: "bg-red-500",
    });

    expect(result.title).toBe("Task");
    expect(result.assigneeInitials).toBeUndefined();
    expect(result.assigneeColor).toBeUndefined();
  });
});
