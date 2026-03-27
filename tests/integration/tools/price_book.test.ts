import { describe, it, expect } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("price_book — integration", () => {
  let serviceId: string | undefined;

  it("create_pricebook_service", async () => {
    const result = await callTool("create_pricebook_service", { name: "Integration Test Service" });
    const text = (result.content[0] as { text: string }).text;
    if (text.includes("404") || text.includes("not found")) return;
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    serviceId = data.id;
    track("pricebook_service", serviceId!);
  });

  it("get_pricebook_service", async () => {
    if (!serviceId) return;
    const result = await callTool("get_pricebook_service", { id: serviceId });
    const data = parseResult(result) as any;
    expect(data.id).toBe(serviceId);
  });

  it("list_pricebook_services", async () => {
    const result = await callTool("list_pricebook_services", {});
    const text = (result.content[0] as { text: string }).text;
    if (text.includes("404") || text.includes("not found")) return;
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
  });

  it("update_pricebook_service", async () => {
    if (!serviceId) return;
    const result = await callTool("update_pricebook_service", {
      id: serviceId,
      name: "Integration Test Service Updated",
    });
    const data = parseResult(result) as any;
    expect(data.name).toBe("Integration Test Service Updated");
  });

  it("delete_pricebook_service", async () => {
    if (!serviceId) return;
    const result = await callTool("delete_pricebook_service", { id: serviceId });
    expect(result.content[0]).toBeDefined();
  });
});
