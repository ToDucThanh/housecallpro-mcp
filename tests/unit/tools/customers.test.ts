import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { customerFixture, addressFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("customers", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  // ── list_customers ────────────────────────────────────────────────────────

  describe("list_customers", () => {
    it("calls GET /customers with the provided params", async () => {
      const mockResponse = { data: { customers: [customerFixture], total_count: 1 } };
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse);

      const result = await mcpClient.callTool({
        name: "list_customers",
        arguments: { q: "Test", page: 1, page_size: 10, sort_direction: "asc" },
      });

      expect(client.get).toHaveBeenCalledWith("/customers", {
        params: expect.objectContaining({ q: "Test", page: 1, page_size: 10, sort_direction: "asc" }),
      });
      const parsed = parseResult(result);
      expect(parsed).toEqual(mockResponse.data);
    });

    it("calls GET /customers with default params when none provided", async () => {
      const mockResponse = { data: { customers: [], total_count: 0 } };
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse);

      await mcpClient.callTool({ name: "list_customers", arguments: {} });

      expect(client.get).toHaveBeenCalledWith("/customers", {
        params: expect.objectContaining({ page: 1, page_size: 10, sort_by: "created_at" }),
      });
    });

    it("includes expand param when provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: { customers: [] } });

      await mcpClient.callTool({
        name: "list_customers",
        arguments: { expand: ["attachments"] },
      });

      expect(client.get).toHaveBeenCalledWith("/customers", {
        params: expect.objectContaining({ expand: ["attachments"] }),
      });
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Network error"));

      const result = await mcpClient.callTool({ name: "list_customers", arguments: {} });

      expect(getErrorText(result)).toContain("Error: Network error");
    });
  });

  // ── get_customer ──────────────────────────────────────────────────────────

  describe("get_customer", () => {
    it("calls GET /customers/:id with params: undefined when expand is not provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: customerFixture });

      const result = await mcpClient.callTool({
        name: "get_customer",
        arguments: { customer_id: "cus_test123" },
      });

      expect(client.get).toHaveBeenCalledWith("/customers/cus_test123", {
        params: undefined,
      });
      expect(parseResult(result)).toEqual(customerFixture);
    });

    it("calls GET /customers/:id with expand params when expand is provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: customerFixture });

      await mcpClient.callTool({
        name: "get_customer",
        arguments: { customer_id: "cus_test123", expand: ["attachments", "do_not_service"] },
      });

      expect(client.get).toHaveBeenCalledWith("/customers/cus_test123", {
        params: { expand: ["attachments", "do_not_service"] },
      });
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_customer",
        arguments: { customer_id: "cus_missing" },
      });

      expect(getErrorText(result)).toContain("Error: Not found");
    });
  });

  // ── create_customer ───────────────────────────────────────────────────────

  describe("create_customer", () => {
    it("calls POST /customers with the provided body fields", async () => {
      vi.mocked(client.post).mockResolvedValueOnce({ data: customerFixture });

      const result = await mcpClient.callTool({
        name: "create_customer",
        arguments: {
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          mobile_number: "555-1234",
        },
      });

      expect(client.post).toHaveBeenCalledWith(
        "/customers",
        expect.objectContaining({
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          mobile_number: "555-1234",
        })
      );
      expect(parseResult(result)).toEqual(customerFixture);
    });

    it("calls POST /customers with minimal fields", async () => {
      vi.mocked(client.post).mockResolvedValueOnce({ data: customerFixture });

      await mcpClient.callTool({
        name: "create_customer",
        arguments: { first_name: "Solo" },
      });

      expect(client.post).toHaveBeenCalledWith(
        "/customers",
        expect.objectContaining({ first_name: "Solo" })
      );
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.post).mockRejectedValueOnce(new Error("Validation failed"));

      const result = await mcpClient.callTool({
        name: "create_customer",
        arguments: { first_name: "Bad" },
      });

      expect(getErrorText(result)).toContain("Error: Validation failed");
    });
  });

  // ── update_customer ───────────────────────────────────────────────────────

  describe("update_customer", () => {
    it("calls PUT /customers/:id with body that does NOT contain customer_id", async () => {
      const updated = { ...customerFixture, email: "new@example.com" };
      vi.mocked(client.put).mockResolvedValueOnce({ data: updated });

      const result = await mcpClient.callTool({
        name: "update_customer",
        arguments: { customer_id: "cus_123", email: "new@example.com" },
      });

      expect(client.put).toHaveBeenCalledWith(
        "/customers/cus_123",
        expect.not.objectContaining({ customer_id: expect.anything() })
      );
      expect(client.put).toHaveBeenCalledWith(
        "/customers/cus_123",
        expect.objectContaining({ email: "new@example.com" })
      );
      expect(parseResult(result)).toEqual(updated);
    });

    it("uses the customer_id in the URL path", async () => {
      vi.mocked(client.put).mockResolvedValueOnce({ data: customerFixture });

      await mcpClient.callTool({
        name: "update_customer",
        arguments: { customer_id: "cus_abc", first_name: "Updated" },
      });

      const [url] = vi.mocked(client.put).mock.calls[0];
      expect(url).toBe("/customers/cus_abc");
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.put).mockRejectedValueOnce(new Error("Forbidden"));

      const result = await mcpClient.callTool({
        name: "update_customer",
        arguments: { customer_id: "cus_123", first_name: "Blocked" },
      });

      expect(getErrorText(result)).toContain("Error: Forbidden");
    });
  });

  // ── list_customer_addresses ───────────────────────────────────────────────

  describe("list_customer_addresses", () => {
    it("calls GET /customers/:id/addresses with pagination params", async () => {
      const mockResponse = { data: { addresses: [addressFixture] } };
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse);

      const result = await mcpClient.callTool({
        name: "list_customer_addresses",
        arguments: { customer_id: "cus_123", page: 2, page_size: 5 },
      });

      expect(client.get).toHaveBeenCalledWith(
        "/customers/cus_123/addresses",
        { params: expect.objectContaining({ page: 2, page_size: 5 }) }
      );
      expect(parseResult(result)).toEqual(mockResponse.data);
    });

    it("includes sort params when provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: { addresses: [] } });

      await mcpClient.callTool({
        name: "list_customer_addresses",
        arguments: { customer_id: "cus_123", sort_by: "updated_at", sort_direction: "desc" },
      });

      expect(client.get).toHaveBeenCalledWith(
        "/customers/cus_123/addresses",
        { params: expect.objectContaining({ sort_by: "updated_at", sort_direction: "desc" }) }
      );
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Server error"));

      const result = await mcpClient.callTool({
        name: "list_customer_addresses",
        arguments: { customer_id: "cus_123" },
      });

      expect(getErrorText(result)).toContain("Error: Server error");
    });
  });

  // ── get_customer_address ──────────────────────────────────────────────────

  describe("get_customer_address", () => {
    it("calls GET /customers/:id/addresses/:addr_id with no second argument", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: addressFixture });

      const result = await mcpClient.callTool({
        name: "get_customer_address",
        arguments: { customer_id: "cus_123", address_id: "adr_456" },
      });

      expect(client.get).toHaveBeenCalledWith("/customers/cus_123/addresses/adr_456");
      expect(client.get).toHaveBeenCalledTimes(1);
      const [, secondArg] = vi.mocked(client.get).mock.calls[0];
      expect(secondArg).toBeUndefined();
      expect(parseResult(result)).toEqual(addressFixture);
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Address not found"));

      const result = await mcpClient.callTool({
        name: "get_customer_address",
        arguments: { customer_id: "cus_123", address_id: "adr_missing" },
      });

      expect(getErrorText(result)).toContain("Error: Address not found");
    });
  });

  // ── create_customer_address ───────────────────────────────────────────────

  describe("create_customer_address", () => {
    it("calls POST /customers/:id/addresses with body NOT containing customer_id", async () => {
      vi.mocked(client.post).mockResolvedValueOnce({ data: addressFixture });

      const result = await mcpClient.callTool({
        name: "create_customer_address",
        arguments: {
          customer_id: "cus_123",
          street: "123 Test St",
          city: "Testville",
          state: "CA",
          zip: "90210",
          country: "US",
        },
      });

      expect(client.post).toHaveBeenCalledWith(
        "/customers/cus_123/addresses",
        expect.not.objectContaining({ customer_id: expect.anything() })
      );
      expect(client.post).toHaveBeenCalledWith(
        "/customers/cus_123/addresses",
        expect.objectContaining({
          street: "123 Test St",
          city: "Testville",
          state: "CA",
          zip: "90210",
          country: "US",
        })
      );
      expect(parseResult(result)).toEqual(addressFixture);
    });

    it("includes optional street_line_2 in body when provided", async () => {
      vi.mocked(client.post).mockResolvedValueOnce({ data: addressFixture });

      await mcpClient.callTool({
        name: "create_customer_address",
        arguments: {
          customer_id: "cus_123",
          street: "456 Main Ave",
          street_line_2: "Apt 7",
          city: "Springfield",
          state: "IL",
          zip: "62701",
        },
      });

      expect(client.post).toHaveBeenCalledWith(
        "/customers/cus_123/addresses",
        expect.objectContaining({ street_line_2: "Apt 7" })
      );
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.post).mockRejectedValueOnce(new Error("Bad request"));

      const result = await mcpClient.callTool({
        name: "create_customer_address",
        arguments: {
          customer_id: "cus_123",
          street: "Bad St",
          city: "Nowhere",
          state: "XX",
          zip: "00000",
        },
      });

      expect(getErrorText(result)).toContain("Error: Bad request");
    });
  });
});
