import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("pipeline — integration", () => {
  it("list_pipeline_statuses with resource_type=job", async () => {
    const result = await callTool("list_pipeline_statuses", { resource_type: "job" });
    const data = parseResult(result);
    expect(data).toBeDefined();
  });

  it("list_pipeline_statuses with resource_type=lead", async () => {
    const result = await callTool("list_pipeline_statuses", { resource_type: "lead" });
    const data = parseResult(result);
    expect(data).toBeDefined();
  });
});
