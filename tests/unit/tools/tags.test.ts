import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { tagFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockClient = client as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("tags", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_tags", () => {
    it("calls GET /tags with no params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [tagFixture] });

      const result = await mcpClient.callTool({ name: "list_tags", arguments: {} });
      const parsed = parseResult(result);

      expect(mockClient.get).toHaveBeenCalledWith("/tags", { params: {} });
      expect(parsed).toEqual([tagFixture]);
    });

    it("passes pagination and sort params", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [tagFixture] });

      await mcpClient.callTool({
        name: "list_tags",
        arguments: { page: 1, page_size: 25, sort_by: "name", sort_direction: "desc" },
      });

      expect(mockClient.get).toHaveBeenCalledWith("/tags", {
        params: { page: 1, page_size: 25, sort_by: "name", sort_direction: "desc" },
      });
    });

    it("returns error text on failure", async () => {
      mockClient.get.mockRejectedValueOnce(new Error("Service unavailable"));

      const result = await mcpClient.callTool({ name: "list_tags", arguments: {} });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Service unavailable");
    });
  });

  describe("create_tag", () => {
    it("calls POST /tags with name in body", async () => {
      mockClient.post.mockResolvedValueOnce({ data: tagFixture });

      const result = await mcpClient.callTool({
        name: "create_tag",
        arguments: { name: tagFixture.name },
      });
      const parsed = parseResult(result);

      expect(mockClient.post).toHaveBeenCalledWith("/tags", { name: tagFixture.name });
      expect(parsed).toEqual(tagFixture);
    });

    it("returns error text on failure", async () => {
      mockClient.post.mockRejectedValueOnce(new Error("Tag already exists"));

      const result = await mcpClient.callTool({
        name: "create_tag",
        arguments: { name: "duplicate-tag" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Tag already exists");
    });
  });

  describe("update_tag", () => {
    it("calls PUT /tags/:tag_id with body excluding tag_id", async () => {
      const updated = { ...tagFixture, name: "updated-tag" };
      mockClient.put.mockResolvedValueOnce({ data: updated });

      const result = await mcpClient.callTool({
        name: "update_tag",
        arguments: { tag_id: tagFixture.id, name: "updated-tag" },
      });
      const parsed = parseResult(result);

      expect(mockClient.put).toHaveBeenCalledWith(`/tags/${tagFixture.id}`, {
        name: "updated-tag",
      });
      // tag_id should not be in the request body
      const callBody = mockClient.put.mock.calls[0][1];
      expect(callBody).not.toHaveProperty("tag_id");
      expect(parsed).toEqual(updated);
    });

    it("uses the correct tag_id in the URL path", async () => {
      mockClient.put.mockResolvedValueOnce({ data: tagFixture });

      await mcpClient.callTool({
        name: "update_tag",
        arguments: { tag_id: "tag_specific_id", name: "new-name" },
      });

      const callUrl = mockClient.put.mock.calls[0][0];
      expect(callUrl).toBe("/tags/tag_specific_id");
    });

    it("returns error text on failure", async () => {
      mockClient.put.mockRejectedValueOnce(new Error("Update failed"));

      const result = await mcpClient.callTool({
        name: "update_tag",
        arguments: { tag_id: tagFixture.id, name: "fail" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Update failed");
    });
  });

  describe("delete_tag", () => {
    it("calls DELETE /tags/:tag_id", async () => {
      mockClient.delete.mockResolvedValueOnce({ data: {} });

      const result = await mcpClient.callTool({
        name: "delete_tag",
        arguments: { tag_id: tagFixture.id },
      });
      parseResult(result);

      expect(mockClient.delete).toHaveBeenCalledWith(`/tags/${tagFixture.id}`);
    });

    it("uses the correct tag_id in the URL path", async () => {
      mockClient.delete.mockResolvedValueOnce({ data: {} });

      await mcpClient.callTool({
        name: "delete_tag",
        arguments: { tag_id: "tag_specific_id" },
      });

      expect(mockClient.delete).toHaveBeenCalledWith("/tags/tag_specific_id");
    });

    it("returns error text on failure", async () => {
      mockClient.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await mcpClient.callTool({
        name: "delete_tag",
        arguments: { tag_id: tagFixture.id },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Delete failed");
    });
  });
});
