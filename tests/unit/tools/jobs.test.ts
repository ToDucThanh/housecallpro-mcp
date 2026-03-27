import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { jobFixture, customerFixture, addressFixture, invoiceFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedGet = client.get as ReturnType<typeof vi.fn>;
const mockedPost = client.post as ReturnType<typeof vi.fn>;
const mockedPut = client.put as ReturnType<typeof vi.fn>;
const mockedDelete = client.delete as ReturnType<typeof vi.fn>;

describe("jobs", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  // ─── list_jobs ────────────────────────────────────────────────────────────

  describe("list_jobs", () => {
    it("calls GET /jobs with no params", async () => {
      mockedGet.mockResolvedValueOnce({ data: { jobs: [jobFixture] } });

      const result = await mcpClient.callTool({ name: "list_jobs", arguments: {} });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/jobs", { params: {} });
      expect(data.jobs[0].id).toBe(jobFixture.id);
    });

    it("passes filter params to GET /jobs", async () => {
      mockedGet.mockResolvedValueOnce({ data: { jobs: [] } });

      await mcpClient.callTool({
        name: "list_jobs",
        arguments: {
          customer_id: customerFixture.id,
          page: 1,
          page_size: 25,
          work_status: ["scheduled", "in_progress"],
          sort_by: "created_at",
          sort_direction: "desc",
        },
      });

      expect(mockedGet).toHaveBeenCalledWith("/jobs", {
        params: {
          customer_id: customerFixture.id,
          page: 1,
          page_size: 25,
          work_status: ["scheduled", "in_progress"],
          sort_by: "created_at",
          sort_direction: "desc",
        },
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Server error"));

      const result = await mcpClient.callTool({ name: "list_jobs", arguments: {} });
      expect(getErrorText(result)).toMatch(/Error:.*Server error/);
    });
  });

  // ─── get_job ──────────────────────────────────────────────────────────────

  describe("get_job", () => {
    it("calls GET /jobs/:id without expand when expand not provided", async () => {
      mockedGet.mockResolvedValueOnce({ data: jobFixture });

      const result = await mcpClient.callTool({
        name: "get_job",
        arguments: { id: jobFixture.id },
      });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledWith(`/jobs/${jobFixture.id}`, { params: undefined });
      expect(data.id).toBe(jobFixture.id);
    });

    it("passes expand param when provided", async () => {
      mockedGet.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "get_job",
        arguments: { id: jobFixture.id, expand: ["attachments", "appointments"] },
      });

      expect(mockedGet).toHaveBeenCalledWith(`/jobs/${jobFixture.id}`, {
        params: { expand: ["attachments", "appointments"] },
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Job not found"));

      const result = await mcpClient.callTool({
        name: "get_job",
        arguments: { id: "job_missing" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Job not found/);
    });
  });

  // ─── create_job ───────────────────────────────────────────────────────────

  describe("create_job", () => {
    it("calls POST /jobs with required fields", async () => {
      mockedPost.mockResolvedValueOnce({ data: jobFixture });

      const result = await mcpClient.callTool({
        name: "create_job",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
        },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledOnce();
      expect(mockedPost).toHaveBeenCalledWith("/jobs", {
        customer_id: customerFixture.id,
        address_id: addressFixture.id,
      });
      expect(data.id).toBe(jobFixture.id);
    });

    it("includes optional fields when provided", async () => {
      mockedPost.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "create_job",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
          start_time: "2026-03-28T09:00:00Z",
          end_time: "2026-03-28T11:00:00Z",
          note: "Handle with care",
        },
      });

      expect(mockedPost).toHaveBeenCalledWith("/jobs", {
        customer_id: customerFixture.id,
        address_id: addressFixture.id,
        start_time: "2026-03-28T09:00:00Z",
        end_time: "2026-03-28T11:00:00Z",
        note: "Handle with care",
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Customer not found"));

      const result = await mcpClient.callTool({
        name: "create_job",
        arguments: { customer_id: "cus_bad", address_id: "adr_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Customer not found/);
    });
  });

  // ─── update_job_schedule ──────────────────────────────────────────────────

  describe("update_job_schedule", () => {
    it("calls PUT /jobs/:job_id/schedule with job_id in URL and body without it", async () => {
      mockedPut.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "update_job_schedule",
        arguments: {
          job_id: jobFixture.id,
          start_time: "2026-03-28T09:00:00Z",
        },
      });

      expect(mockedPut).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/schedule`, {
        start_time: "2026-03-28T09:00:00Z",
      });
    });

    it("includes optional schedule fields in body but not job_id", async () => {
      mockedPut.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "update_job_schedule",
        arguments: {
          job_id: jobFixture.id,
          start_time: "2026-03-28T09:00:00Z",
          end_time: "2026-03-28T11:00:00Z",
          notify: true,
          notify_pro: false,
        },
      });

      const call = mockedPut.mock.calls[0];
      expect(call[0]).toBe(`/jobs/${jobFixture.id}/schedule`);
      expect(call[1]).not.toHaveProperty("job_id");
      expect(call[1]).toMatchObject({
        start_time: "2026-03-28T09:00:00Z",
        end_time: "2026-03-28T11:00:00Z",
        notify: true,
        notify_pro: false,
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPut.mockRejectedValueOnce(new Error("Conflict"));

      const result = await mcpClient.callTool({
        name: "update_job_schedule",
        arguments: { job_id: jobFixture.id, start_time: "2026-03-28T09:00:00Z" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Conflict/);
    });
  });

  // ─── delete_job_schedule ──────────────────────────────────────────────────

  describe("delete_job_schedule", () => {
    it("calls DELETE /jobs/:job_id/schedule", async () => {
      mockedDelete.mockResolvedValueOnce({ data: {} });

      await mcpClient.callTool({
        name: "delete_job_schedule",
        arguments: { job_id: jobFixture.id },
      });

      expect(mockedDelete).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/schedule`);
    });

    it("returns an error message when the client throws", async () => {
      mockedDelete.mockRejectedValueOnce(new Error("Job not found"));

      const result = await mcpClient.callTool({
        name: "delete_job_schedule",
        arguments: { job_id: "job_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Job not found/);
    });
  });

  // ─── dispatch_job ─────────────────────────────────────────────────────────

  describe("dispatch_job", () => {
    it("calls PUT /jobs/:job_id/dispatch with employees in body and job_id in URL", async () => {
      mockedPut.mockResolvedValueOnce({ data: jobFixture });

      const dispatched = [{ employee_id: "emp_1" }, { employee_id: "emp_2" }];
      await mcpClient.callTool({
        name: "dispatch_job",
        arguments: { job_id: jobFixture.id, dispatched_employees: dispatched },
      });

      expect(mockedPut).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/dispatch`, {
        dispatched_employees: dispatched,
      });
    });

    it("does not include job_id in the request body", async () => {
      mockedPut.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "dispatch_job",
        arguments: { job_id: jobFixture.id, dispatched_employees: [{ employee_id: "emp_1" }] },
      });

      const bodyArg = mockedPut.mock.calls[0][1];
      expect(bodyArg).not.toHaveProperty("job_id");
    });

    it("returns an error message when the client throws", async () => {
      mockedPut.mockRejectedValueOnce(new Error("Employee not found"));

      const result = await mcpClient.callTool({
        name: "dispatch_job",
        arguments: { job_id: jobFixture.id, dispatched_employees: [{ employee_id: "emp_bad" }] },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Employee not found/);
    });
  });

  // ─── add_job_attachment ───────────────────────────────────────────────────

  describe("add_job_attachment", () => {
    it("calls POST /jobs/:job_id/attachments with file_url in body", async () => {
      mockedPost.mockResolvedValueOnce({ data: { id: "att_1", file_url: "https://example.com/file.pdf" } });

      const result = await mcpClient.callTool({
        name: "add_job_attachment",
        arguments: { job_id: jobFixture.id, file_url: "https://example.com/file.pdf" },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/attachments`, {
        file_url: "https://example.com/file.pdf",
      });
      expect(data.file_url).toBe("https://example.com/file.pdf");
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Invalid file URL"));

      const result = await mcpClient.callTool({
        name: "add_job_attachment",
        arguments: { job_id: jobFixture.id, file_url: "bad-url" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Invalid file URL/);
    });
  });

  // ─── list_job_line_items ──────────────────────────────────────────────────

  describe("list_job_line_items", () => {
    it("calls GET /jobs/:job_id/line_items", async () => {
      mockedGet.mockResolvedValueOnce({ data: { line_items: [] } });

      await mcpClient.callTool({
        name: "list_job_line_items",
        arguments: { job_id: jobFixture.id },
      });

      expect(mockedGet).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/line_items`);
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Job not found"));

      const result = await mcpClient.callTool({
        name: "list_job_line_items",
        arguments: { job_id: "job_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Job not found/);
    });
  });

  // ─── add_job_line_item ────────────────────────────────────────────────────

  describe("add_job_line_item", () => {
    it("calls POST /jobs/:job_id/line_items with body excluding job_id", async () => {
      mockedPost.mockResolvedValueOnce({ data: { id: "li_1", name: "Labor" } });

      await mcpClient.callTool({
        name: "add_job_line_item",
        arguments: { job_id: jobFixture.id, name: "Labor", unit_price: 75, quantity: 2 },
      });

      const call = mockedPost.mock.calls[0];
      expect(call[0]).toBe(`/jobs/${jobFixture.id}/line_items`);
      expect(call[1]).not.toHaveProperty("job_id");
      expect(call[1]).toMatchObject({ name: "Labor", unit_price: 75, quantity: 2 });
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Validation error"));

      const result = await mcpClient.callTool({
        name: "add_job_line_item",
        arguments: { job_id: jobFixture.id, name: "" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Validation error/);
    });
  });

  // ─── bulk_update_job_line_items ───────────────────────────────────────────

  describe("bulk_update_job_line_items", () => {
    it("calls PUT /jobs/:job_id/line_items/bulk_update with line_items array", async () => {
      mockedPut.mockResolvedValueOnce({ data: { line_items: [] } });

      const lineItems = [{ id: "li_1", name: "Part A", unit_price: 50 }];
      await mcpClient.callTool({
        name: "bulk_update_job_line_items",
        arguments: { job_id: jobFixture.id, line_items: lineItems },
      });

      expect(mockedPut).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/line_items/bulk_update`, {
        line_items: lineItems,
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPut.mockRejectedValueOnce(new Error("Bulk update failed"));

      const result = await mcpClient.callTool({
        name: "bulk_update_job_line_items",
        arguments: { job_id: jobFixture.id, line_items: [] },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Bulk update failed/);
    });
  });

  // ─── list_job_input_materials ─────────────────────────────────────────────

  describe("list_job_input_materials", () => {
    it("calls GET /jobs/:job_id/job_input_materials", async () => {
      mockedGet.mockResolvedValueOnce({ data: { job_input_materials: [] } });

      await mcpClient.callTool({
        name: "list_job_input_materials",
        arguments: { job_id: jobFixture.id },
      });

      expect(mockedGet).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/job_input_materials`);
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "list_job_input_materials",
        arguments: { job_id: "job_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Not found/);
    });
  });

  // ─── bulk_update_job_input_materials ──────────────────────────────────────

  describe("bulk_update_job_input_materials", () => {
    it("calls PUT /jobs/:job_id/job_input_materials/bulk_update with job_input_materials array", async () => {
      mockedPut.mockResolvedValueOnce({ data: { job_input_materials: [] } });

      const materials = [{ material_id: "mat_1", quantity: 3 }];
      await mcpClient.callTool({
        name: "bulk_update_job_input_materials",
        arguments: { job_id: jobFixture.id, job_input_materials: materials },
      });

      expect(mockedPut).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/job_input_materials/bulk_update`, {
        job_input_materials: materials,
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPut.mockRejectedValueOnce(new Error("Material not found"));

      const result = await mcpClient.callTool({
        name: "bulk_update_job_input_materials",
        arguments: { job_id: jobFixture.id, job_input_materials: [] },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Material not found/);
    });
  });

  // ─── add_job_tag ──────────────────────────────────────────────────────────

  describe("add_job_tag", () => {
    it("calls POST /jobs/:job_id/tags with tag_id in body", async () => {
      mockedPost.mockResolvedValueOnce({ data: jobFixture });

      await mcpClient.callTool({
        name: "add_job_tag",
        arguments: { job_id: jobFixture.id, tag_id: "tag_abc" },
      });

      expect(mockedPost).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/tags`, { tag_id: "tag_abc" });
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Tag not found"));

      const result = await mcpClient.callTool({
        name: "add_job_tag",
        arguments: { job_id: jobFixture.id, tag_id: "tag_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Tag not found/);
    });
  });

  // ─── remove_job_tag ───────────────────────────────────────────────────────

  describe("remove_job_tag", () => {
    it("calls DELETE /jobs/:job_id/tags/:tag_id", async () => {
      mockedDelete.mockResolvedValueOnce({ data: {} });

      await mcpClient.callTool({
        name: "remove_job_tag",
        arguments: { job_id: jobFixture.id, tag_id: "tag_abc" },
      });

      expect(mockedDelete).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/tags/tag_abc`);
    });

    it("returns an error message when the client throws", async () => {
      mockedDelete.mockRejectedValueOnce(new Error("Tag not associated"));

      const result = await mcpClient.callTool({
        name: "remove_job_tag",
        arguments: { job_id: jobFixture.id, tag_id: "tag_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Tag not associated/);
    });
  });

  // ─── add_job_note ─────────────────────────────────────────────────────────

  describe("add_job_note", () => {
    it("calls POST /jobs/:job_id/notes with content in body", async () => {
      mockedPost.mockResolvedValueOnce({ data: { id: "note_1", content: "Follow up needed" } });

      const result = await mcpClient.callTool({
        name: "add_job_note",
        arguments: { job_id: jobFixture.id, content: "Follow up needed" },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/notes`, {
        content: "Follow up needed",
      });
      expect(data.content).toBe("Follow up needed");
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Content required"));

      const result = await mcpClient.callTool({
        name: "add_job_note",
        arguments: { job_id: jobFixture.id, content: "" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Content required/);
    });
  });

  // ─── delete_job_note ──────────────────────────────────────────────────────

  describe("delete_job_note", () => {
    it("calls DELETE /jobs/:job_id/notes/:note_id", async () => {
      mockedDelete.mockResolvedValueOnce({ data: {} });

      await mcpClient.callTool({
        name: "delete_job_note",
        arguments: { job_id: jobFixture.id, note_id: "note_abc" },
      });

      expect(mockedDelete).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/notes/note_abc`);
    });

    it("returns an error message when the client throws", async () => {
      mockedDelete.mockRejectedValueOnce(new Error("Note not found"));

      const result = await mcpClient.callTool({
        name: "delete_job_note",
        arguments: { job_id: jobFixture.id, note_id: "note_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Note not found/);
    });
  });

  // ─── create_job_link ──────────────────────────────────────────────────────

  describe("create_job_link", () => {
    it("calls POST /jobs/:job_id/links with name and url in body (no job_id)", async () => {
      mockedPost.mockResolvedValueOnce({ data: { id: "link_1", name: "Invoice", url: "https://example.com/inv" } });

      await mcpClient.callTool({
        name: "create_job_link",
        arguments: { job_id: jobFixture.id, name: "Invoice", url: "https://example.com/inv" },
      });

      const call = mockedPost.mock.calls[0];
      expect(call[0]).toBe(`/jobs/${jobFixture.id}/links`);
      expect(call[1]).not.toHaveProperty("job_id");
      expect(call[1]).toMatchObject({ name: "Invoice", url: "https://example.com/inv" });
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Invalid URL"));

      const result = await mcpClient.callTool({
        name: "create_job_link",
        arguments: { job_id: jobFixture.id, name: "Bad link", url: "not-a-url" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Invalid URL/);
    });
  });

  // ─── lock_job ─────────────────────────────────────────────────────────────

  describe("lock_job", () => {
    it("calls POST /jobs/:job_id/lock", async () => {
      mockedPost.mockResolvedValueOnce({ data: { locked: true } });

      const result = await mcpClient.callTool({
        name: "lock_job",
        arguments: { job_id: jobFixture.id },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/lock`);
      expect(data.locked).toBe(true);
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Already locked"));

      const result = await mcpClient.callTool({
        name: "lock_job",
        arguments: { job_id: jobFixture.id },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Already locked/);
    });
  });

  // ─── lock_jobs_by_time_range ──────────────────────────────────────────────

  describe("lock_jobs_by_time_range", () => {
    it("calls POST /jobs/lock with start_time and end_time in body", async () => {
      mockedPost.mockResolvedValueOnce({ data: { locked_count: 5 } });

      const result = await mcpClient.callTool({
        name: "lock_jobs_by_time_range",
        arguments: {
          start_time: "2026-03-01T00:00:00Z",
          end_time: "2026-03-31T23:59:59Z",
        },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledWith("/jobs/lock", {
        start_time: "2026-03-01T00:00:00Z",
        end_time: "2026-03-31T23:59:59Z",
      });
      expect(data.locked_count).toBe(5);
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Invalid time range"));

      const result = await mcpClient.callTool({
        name: "lock_jobs_by_time_range",
        arguments: { start_time: "bad", end_time: "bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Invalid time range/);
    });
  });

  // ─── get_job_invoices ─────────────────────────────────────────────────────

  describe("get_job_invoices", () => {
    it("calls GET /jobs/:job_id/invoices and returns invoices", async () => {
      mockedGet.mockResolvedValueOnce({ data: { invoices: [invoiceFixture] } });

      const result = await mcpClient.callTool({
        name: "get_job_invoices",
        arguments: { job_id: jobFixture.id },
      });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledWith(`/jobs/${jobFixture.id}/invoices`);
      expect(data.invoices[0].id).toBe(invoiceFixture.id);
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Job not found"));

      const result = await mcpClient.callTool({
        name: "get_job_invoices",
        arguments: { job_id: "job_bad" },
      });
      expect(getErrorText(result)).toMatch(/Error:.*Job not found/);
    });
  });
});
