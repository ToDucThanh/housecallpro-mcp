import { describe, it, expect } from "vitest";
import { callTool } from "../helpers/setup.js";

describe("job_types — integration", () => {
  it("list_job_types returns a result or a known not-available error", async () => {
    const result = await callTool("list_job_types", {});
    const text = (result.content[0] as { text: string }).text;
    const isSuccess = text.startsWith("{") || text.startsWith("[");
    const isExpectedError = text.includes("404") || text.includes("not found");
    expect(isSuccess || isExpectedError).toBe(true);
  });
});
