import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { leadFixture, customerFixture, addressFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockClient = client as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("leads", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_leads", () => {
    it("calls GET /leads with no params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [leadFixture] });

      const result = await mcpClient.callTool({ name: "list_leads", arguments: {} });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith("/leads", { params: {} });
      expect(parsed).toEqual([leadFixture]);
    });

    it("passes pagination and sort params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [leadFixture] });

      await mcpClient.callTool({
        name: "list_leads",
        arguments: { page: 2, page_size: 20, sort_by: "created_at", sort_direction: "desc" },
      });

      expect(mockClient.get).toHaveBeenCalledWith("/leads", {
        params: { page: 2, page_size: 20, sort_by: "created_at", sort_direction: "desc" },
      });
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Timeout"));

      const result = await mcpClient.callTool({ name: "list_leads", arguments: {} });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Timeout");
    });
  });

  describe("get_lead", () => {
    it("calls GET /leads/:id", async () => {
      mockClient.get.mockResolvedValueOnce({ data: leadFixture });

      const result = await mcpClient.callTool({
        name: "get_lead",
        arguments: { id: leadFixture.id },
      });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith(`/leads/${leadFixture.id}`);
      expect(parsed).toEqual(leadFixture);
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_lead",
        arguments: { id: "nonexistent_lead" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Not found");
    });
  });

  describe("create_lead", () => {
    it("calls POST /leads with customer_id in body", async () => {
      mockClient.post.mockResolvedValueOnce({ data: leadFixture });

      const result = await mcpClient.callTool({
        name: "create_lead",
        arguments: { customer_id: customerFixture.id },
      });
      const parsed = parseResult(result);

      expect(mockClient.post).toHaveBeenCalledWith("/leads", {
        customer_id: customerFixture.id,
      });
      expect(parsed).toEqual(leadFixture);
    });

    it("calls POST /leads with all optional params", async () => {
      mockClient.post.mockResolvedValueOnce({ data: leadFixture });

      const result = await mcpClient.callTool({
        name: "create_lead",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
          note: "Test note",
          lead_source: "website",
        },
      });
      const parsed = parseResult(result);

      expect(mockClient.post).toHaveBeenCalledWith("/leads", {
        customer_id: customerFixture.id,
        address_id: addressFixture.id,
        note: "Test note",
        lead_source: "website",
      });
      expect(parsed).toEqual(leadFixture);
    });

    it("includes customer_id in request body (not as URL param)", async () => {
      mockClient.post.mockResolvedValueOnce({ data: leadFixture });

      await mcpClient.callTool({
        name: "create_lead",
        arguments: { customer_id: customerFixture.id },
      });

      const [url, body] = mockClient.post.mock.calls[0];
      expect(url).toBe("/leads");
      expect(body).toHaveProperty("customer_id", customerFixture.id);
    });

    it("returns error text on failure", async () => {
      mockClient.post.mockRejectedValueOnce(new Error("Customer not found"));

      const result = await mcpClient.callTool({
        name: "create_lead",
        arguments: { customer_id: "bad_customer" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Customer not found");
    });
  });
});
