import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("company — integration", () => {
  it("get_company returns company properties", async () => {
    const result = await callTool("get_company", {});
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    // Company should have at least one identifying property
    const hasId = data.id !== undefined;
    const hasName = data.name !== undefined;
    expect(hasId || hasName).toBe(true);
  });
});
