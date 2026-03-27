import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("material_categories — integration", () => {
  it("list_material_categories returns a result or a known not-available error", async () => {
    const result = await callTool("list_material_categories", {});
    const text = (result.content[0] as { text: string }).text;
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("not found");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
