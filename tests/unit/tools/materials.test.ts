import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { materialFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockClient = client as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("materials", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_materials", () => {
    it("calls GET /materials with no params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [materialFixture] });

      const result = await mcpClient.callTool({ name: "list_materials", arguments: {} });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith("/materials", { params: {} });
      expect(parsed).toEqual([materialFixture]);
    });

    it("passes pagination and sort params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [materialFixture] });

      await mcpClient.callTool({
        name: "list_materials",
        arguments: { page: 2, page_size: 10, sort_by: "name", sort_direction: "asc" },
      });

      expect(mockClient.get).toHaveBeenCalledWith("/materials", {
        params: { page: 2, page_size: 10, sort_by: "name", sort_direction: "asc" },
      });
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await mcpClient.callTool({ name: "list_materials", arguments: {} });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Network error");
    });
  });

  describe("get_material", () => {
    it("calls GET /materials/:id", async () => {
      mockClient.get.mockResolvedValueOnce({ data: materialFixture });

      const result = await mcpClient.callTool({
        name: "get_material",
        arguments: { id: materialFixture.id },
      });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith(`/materials/${materialFixture.id}`);
      expect(parsed).toEqual(materialFixture);
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_material",
        arguments: { id: "missing_id" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Not found");
    });
  });

  describe("create_material", () => {
    it("calls POST /materials with full body", async () => {
      mockClient.post.mockResolvedValueOnce({ data: materialFixture });

      const result = await mcpClient.callTool({
        name: "create_material",
        arguments: {
          name: materialFixture.name,
          price: materialFixture.price,
          unit_cost: materialFixture.unit_cost,
          description: materialFixture.description,
        },
      });
      const parsed = parseResult(result);

      expect(mockClient.post).toHaveBeenCalledWith("/materials", {
        name: materialFixture.name,
        price: materialFixture.price,
        unit_cost: materialFixture.unit_cost,
        description: materialFixture.description,
      });
      expect(parsed).toEqual(materialFixture);
    });

    it("calls POST /materials with only required name", async () => {
      mockClient.post.mockResolvedValueOnce({ data: { ...materialFixture, price: undefined } });

      await mcpClient.callTool({
        name: "create_material",
        arguments: { name: "Minimal Material" },
      });

      expect(mockClient.post).toHaveBeenCalledWith("/materials", { name: "Minimal Material" });
    });

    it("returns error text on failure", async () => {
      mockClient.post.mockRejectedValueOnce(new Error("Validation failed"));

      const result = await mcpClient.callTool({
        name: "create_material",
        arguments: { name: "Bad Material" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Validation failed");
    });
  });

  describe("update_material", () => {
    it("calls PUT /materials/:id with body excluding id", async () => {
      const updated = { ...materialFixture, name: "Updated Material" };
      mockClient.put.mockResolvedValueOnce({ data: updated });

      const result = await mcpClient.callTool({
        name: "update_material",
        arguments: { id: materialFixture.id, name: "Updated Material" },
      });
      const parsed = parseResult(result);

      expect(mockClient.put).toHaveBeenCalledWith(`/materials/${materialFixture.id}`, {
        name: "Updated Material",
      });
      // id should not be in the request body
      const callArgs = mockClient.put.mock.calls[0];
      expect(callArgs[1]).not.toHaveProperty("id");
      expect(parsed).toEqual(updated);
    });

    it("sends multiple optional fields in body", async () => {
      mockClient.put.mockResolvedValueOnce({ data: materialFixture });

      await mcpClient.callTool({
        name: "update_material",
        arguments: {
          id: materialFixture.id,
          price: 20.0,
          unit_cost: 10.0,
          description: "New desc",
        },
      });

      const callBody = mockClient.put.mock.calls[0][1];
      expect(callBody).toEqual({ price: 20.0, unit_cost: 10.0, description: "New desc" });
      expect(callBody).not.toHaveProperty("id");
    });

    it("returns error text on failure", async () => {
      mockClient.put.mockRejectedValueOnce(new Error("Update failed"));

      const result = await mcpClient.callTool({
        name: "update_material",
        arguments: { id: materialFixture.id, name: "Fail" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Update failed");
    });
  });

  describe("delete_material", () => {
    it("calls DELETE /materials/:id", async () => {
      mockClient.delete.mockResolvedValueOnce({ data: {} });

      const result = await mcpClient.callTool({
        name: "delete_material",
        arguments: { id: materialFixture.id },
      });
      parseResult(result);

      expect(mockClient.delete).toHaveBeenCalledWith(`/materials/${materialFixture.id}`);
    });

    it("returns error text on failure", async () => {
      mockClient.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await mcpClient.callTool({
        name: "delete_material",
        arguments: { id: materialFixture.id },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Delete failed");
    });
  });
});
