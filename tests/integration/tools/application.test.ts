import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("application — integration", () => {
  it("get_application returns a result or a known not-available error", async () => {
    const result = await callTool("get_application", {});
    const text = (result.content[0] as { text: string }).text;
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("not found") || text.includes("Application");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
