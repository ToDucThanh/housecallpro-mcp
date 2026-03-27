import { describe, it, expect } from "vitest";
import { callTool, parseResult } from "../helpers/setup.js";

describe("invoices — integration", () => {
  it("list_invoices returns invoices array", async () => {
    const result = await callTool("list_invoices", {});
    const data = parseResult(result) as any;
    expect(data).toHaveProperty("invoices");
    expect(Array.isArray(data.invoices)).toBe(true);
  });
});
