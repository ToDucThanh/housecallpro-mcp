import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("routes — integration", () => {
  it("list_routes returns a defined result", async () => {
    const result = await callTool("list_routes", {});
    const data = parseResult(result);
    expect(data).toBeDefined();
  });
});
