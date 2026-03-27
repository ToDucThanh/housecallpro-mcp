import { describe, it, expect, beforeAll } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("estimates — integration", () => {
  let customerId: string;
  let addressId: string;
  let estimateId: string | undefined;

  beforeAll(async () => {
    const custResult = await callTool("create_customer", {
      first_name: "Estimates",
      last_name: "IntegrationTest",
      notifications_enabled: false,
    });
    const custData = parseResult(custResult) as any;
    customerId = custData.id;
    track("customer", customerId);

    const addrResult = await callTool("create_customer_address", {
      customer_id: customerId,
      street: "123 Estimate St",
      city: "Testville",
      state: "CA",
      zip: "90210",
      country: "US",
    });
    addressId = (parseResult(addrResult) as any).id;
  });

  it("create_estimate", async () => {
    const result = await callTool("create_estimate", {
      customer_id: customerId,
      address_id: addressId,
      options: [{ name: "Option 1" }],
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    estimateId = data.id;
  });

  it("get_estimate", async () => {
    if (!estimateId) return;
    const result = await callTool("get_estimate", { id: estimateId });
    const data = parseResult(result) as any;
    expect(data.id).toBe(estimateId);
  });

  it("list_estimates returns defined array", async () => {
    const result = await callTool("list_estimates", {});
    const data = parseResult(result) as any;
    expect(data).toBeDefined();
  });
});
