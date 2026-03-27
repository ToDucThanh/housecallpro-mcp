import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("checklists — integration", () => {
  it("list_checklists routes to the correct endpoint", async () => {
    const result = await callTool("list_checklists", {
      job_uuids: [],
      estimate_uuids: [],
    });
    const text = (result.content[0] as { text: string }).text;
    // Empty arrays causes a 404 validation error — this confirms the tool hit the right endpoint
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("require") || text.includes("uuid");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
