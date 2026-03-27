import { describe, it, expect, beforeAll } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("leads — integration", () => {
  let customerId: string;
  let leadId: string;

  beforeAll(async () => {
    const result = await callTool("create_customer", {
      first_name: "Leads",
      last_name: "IntegrationTest",
      notifications_enabled: false,
    });
    const data = parseResult(result) as any;
    customerId = data.id;
    track("customer", customerId);
  });

  it("create_lead", async () => {
    const result = await callTool("create_lead", {
      customer_id: customerId,
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    leadId = data.id;
  });

  it("get_lead", async () => {
    const result = await callTool("get_lead", { id: leadId });
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    expect(data.id).toBe(leadId);
  });

  it("list_leads returns defined array", async () => {
    const result = await callTool("list_leads", {});
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
    const leads = data.leads ?? data.data ?? data.items ?? [];
    expect(Array.isArray(leads)).toBe(true);
  });
});
