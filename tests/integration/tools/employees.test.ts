import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("employees — integration", () => {
  it("list_employees returns employees array", async () => {
    const result = await callTool("list_employees", {});
    const data = parseResult(result) as any;
    expect(data).toHaveProperty("employees");
    expect(Array.isArray(data.employees)).toBe(true);
  });
});
