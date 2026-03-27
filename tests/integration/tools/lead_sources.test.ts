import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("lead_sources — integration", () => {
  it("list_lead_sources returns a defined result", async () => {
    const result = await callTool("list_lead_sources", {});
    const data = parseResult(result);
    expect(data).toBeDefined();
  });
});
