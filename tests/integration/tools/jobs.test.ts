import { describe, it, expect, beforeAll } from "vitest";
import { callTool, parseResult, track } from "../helpers/setup.js";

describe("jobs — integration", () => {
  let customerId: string;
  let addressId: string;
  let jobId: string;

  beforeAll(async () => {
    // Create a customer + address to use for job creation
    const custResult = await callTool("create_customer", {
      first_name: "Jobs",
      last_name: "IntegrationTest",
      notifications_enabled: false,
    });
    const custData = parseResult(custResult) as any;
    customerId = custData.id;
    track("customer", customerId);

    const addrResult = await callTool("create_customer_address", {
      customer_id: customerId,
      street: "789 Job St",
      city: "Jobville",
      state: "CA",
      zip: "90210",
      country: "US",
    });
    addressId = (parseResult(addrResult) as any).id;
  });

  it("create_job", async () => {
    const result = await callTool("create_job", {
      customer_id: customerId,
      address_id: addressId,
    });
    const data = parseResult(result) as any;
    expect(data.id).toBeDefined();
    jobId = data.id;
  });

  it("get_job", async () => {
    const result = await callTool("get_job", { id: jobId });
    const data = parseResult(result) as any;
    expect(data.id).toBe(jobId);
  });

  it("list_jobs", async () => {
    const result = await callTool("list_jobs", { customer_id: customerId });
    const data = parseResult(result) as any;
    expect(data.jobs).toBeDefined();
  });

  it("update_job_schedule", async () => {
    const result = await callTool("update_job_schedule", {
      job_id: jobId,
      start_time: "2025-06-01T09:00:00",
      end_time: "2025-06-01T10:00:00",
    });
    const data = parseResult(result) as any;
    expect(data.scheduled_start).toBeDefined();
  });

  it("add_job_note", async () => {
    const result = await callTool("add_job_note", {
      job_id: jobId,
      content: "Integration test note",
    });
    // Should not error
    expect(result.content[0]).toBeDefined();
  });

  it("list_job_line_items", async () => {
    const result = await callTool("list_job_line_items", { job_id: jobId });
    expect(result.content[0]).toBeDefined();
  });

  it("get_job_invoices", async () => {
    const result = await callTool("get_job_invoices", { job_id: jobId });
    expect(result.content[0]).toBeDefined();
  });

  it("list_job_appointments", async () => {
    const result = await callTool("list_job_appointments", { job_id: jobId });
    expect(result.content[0]).toBeDefined();
  });

  it("list_job_input_materials", async () => {
    const result = await callTool("list_job_input_materials", { job_id: jobId });
    expect(result.content[0]).toBeDefined();
  });
});
