import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("price_forms — integration", () => {
  it("list_price_forms returns a result or a known not-available error", async () => {
    const result = await callTool("list_price_forms", {});
    const text = (result.content[0] as { text: string }).text;
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("not found");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
