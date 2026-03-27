import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("service_zones — integration", () => {
  it("list_service_zones returns a defined result", async () => {
    const result = await callTool("list_service_zones", {});
    const data = parseResult(result);
    expect(data).toBeDefined();
  });
});
