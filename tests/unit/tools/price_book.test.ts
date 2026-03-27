import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { priceBookServiceFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockClient = client as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("price_book", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_pricebook_services", () => {
    it("calls GET /price_book/services with no params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [priceBookServiceFixture] });

      const result = await mcpClient.callTool({ name: "list_pricebook_services", arguments: {} });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith("/price_book/services", { params: {} });
      expect(parsed).toEqual([priceBookServiceFixture]);
    });

    it("passes pagination and sort params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [priceBookServiceFixture] });

      await mcpClient.callTool({
        name: "list_pricebook_services",
        arguments: { page: 3, page_size: 5, sort_by: "name", sort_direction: "asc" },
      });

      expect(mockClient.get).toHaveBeenCalledWith("/price_book/services", {
        params: { page: 3, page_size: 5, sort_by: "name", sort_direction: "asc" },
      });
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await mcpClient.callTool({ name: "list_pricebook_services", arguments: {} });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Unauthorized");
    });
  });

  describe("get_pricebook_service", () => {
    it("calls GET /price_book/services/:id", async () => {
      mockClient.get.mockResolvedValueOnce({ data: priceBookServiceFixture });

      const result = await mcpClient.callTool({
        name: "get_pricebook_service",
        arguments: { id: priceBookServiceFixture.id },
      });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith(
        `/price_book/services/${priceBookServiceFixture.id}`
      );
      expect(parsed).toEqual(priceBookServiceFixture);
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_pricebook_service",
        arguments: { id: "nonexistent" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Not found");
    });
  });

  describe("create_pricebook_service", () => {
    it("calls POST /price_book/services with full body", async () => {
      mockClient.post.mockResolvedValueOnce({ data: priceBookServiceFixture });

      const result = await mcpClient.callTool({
        name: "create_pricebook_service",
        arguments: {
          name: priceBookServiceFixture.name,
          description: priceBookServiceFixture.description,
          unit_price: priceBookServiceFixture.unit_price,
          online_booking: priceBookServiceFixture.online_booking,
        },
      });
      const parsed = parseResult(result);

      expect(mockClient.post).toHaveBeenCalledWith("/price_book/services", {
        name: priceBookServiceFixture.name,
        description: priceBookServiceFixture.description,
        unit_price: priceBookServiceFixture.unit_price,
        online_booking: priceBookServiceFixture.online_booking,
      });
      expect(parsed).toEqual(priceBookServiceFixture);
    });

    it("calls POST /price_book/services with only required name", async () => {
      mockClient.post.mockResolvedValueOnce({ data: priceBookServiceFixture });

      await mcpClient.callTool({
        name: "create_pricebook_service",
        arguments: { name: "Minimal Service" },
      });

      expect(mockClient.post).toHaveBeenCalledWith("/price_book/services", {
        name: "Minimal Service",
      });
    });

    it("returns error text on failure", async () => {
      mockClient.post.mockRejectedValueOnce(new Error("Creation failed"));

      const result = await mcpClient.callTool({
        name: "create_pricebook_service",
        arguments: { name: "Bad Service" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Creation failed");
    });
  });

  describe("update_pricebook_service", () => {
    it("calls PUT /price_book/services/:id with body excluding id", async () => {
      const updated = { ...priceBookServiceFixture, name: "Updated Service", unit_price: 199.99 };
      mockClient.put.mockResolvedValueOnce({ data: updated });

      const result = await mcpClient.callTool({
        name: "update_pricebook_service",
        arguments: {
          id: priceBookServiceFixture.id,
          name: "Updated Service",
          unit_price: 199.99,
        },
      });
      const parsed = parseResult(result);

      expect(mockClient.put).toHaveBeenCalledWith(
        `/price_book/services/${priceBookServiceFixture.id}`,
        { name: "Updated Service", unit_price: 199.99 }
      );
      // id should not be in the request body
      const callBody = mockClient.put.mock.calls[0][1];
      expect(callBody).not.toHaveProperty("id");
      expect(parsed).toEqual(updated);
    });

    it("sends online_booking field in body", async () => {
      mockClient.put.mockResolvedValueOnce({ data: priceBookServiceFixture });

      await mcpClient.callTool({
        name: "update_pricebook_service",
        arguments: { id: priceBookServiceFixture.id, online_booking: true },
      });

      const callBody = mockClient.put.mock.calls[0][1];
      expect(callBody).toEqual({ online_booking: true });
      expect(callBody).not.toHaveProperty("id");
    });

    it("returns error text on failure", async () => {
      mockClient.put.mockRejectedValueOnce(new Error("Update failed"));

      const result = await mcpClient.callTool({
        name: "update_pricebook_service",
        arguments: { id: priceBookServiceFixture.id, name: "Fail" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Update failed");
    });
  });

  describe("delete_pricebook_service", () => {
    it("calls DELETE /price_book/services/:id", async () => {
      mockClient.delete.mockResolvedValueOnce({ data: {} });

      const result = await mcpClient.callTool({
        name: "delete_pricebook_service",
        arguments: { id: priceBookServiceFixture.id },
      });
      parseResult(result);

      expect(mockClient.delete).toHaveBeenCalledWith(
        `/price_book/services/${priceBookServiceFixture.id}`
      );
    });

    it("returns error text on failure", async () => {
      mockClient.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await mcpClient.callTool({
        name: "delete_pricebook_service",
        arguments: { id: priceBookServiceFixture.id },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Delete failed");
    });
  });
});
