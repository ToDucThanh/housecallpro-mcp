import { describe, it, expect } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("customers — integration", () => {
  let customerId: string;
  let addressId: string;

  it("create_customer", async () => {
    const result = await callTool("create_customer", {
      first_name: "Integration",
      last_name: "TestUser",
      notifications_enabled: false,
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    customerId = data.id;
    track("customer", customerId);
  });

  it("get_customer", async () => {
    const result = await callTool("get_customer", { customer_id: customerId });
    const data = parseResult(result) as any;
    expect(data.first_name).toBe("Integration");
  });

  it("update_customer", async () => {
    const result = await callTool("update_customer", {
      customer_id: customerId,
      email: "integration@test.example",
    });
    const data = parseResult(result) as any;
    expect(data.email).toBe("integration@test.example");
  });

  it("list_customers — search by name", async () => {
    const result = await callTool("list_customers", { q: "Integration" });
    const data = parseResult(result) as any;
    expect(data.customers).toBeDefined();
  });

  it("create_customer_address", async () => {
    const result = await callTool("create_customer_address", {
      customer_id: customerId,
      street: "456 Integration Ave",
      city: "Testville",
      state: "CA",
      zip: "90210",
      country: "US",
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    addressId = data.id;
  });

  it("list_customer_addresses", async () => {
    const result = await callTool("list_customer_addresses", { customer_id: customerId });
    const data = parseResult(result) as any;
    expect(Array.isArray(data.addresses)).toBe(true);
  });

  it("get_customer_address", async () => {
    const result = await callTool("get_customer_address", {
      customer_id: customerId,
      address_id: addressId,
    });
    const data = parseResult(result) as any;
    expect(data.street).toBe("456 Integration Ave");
  });
});
