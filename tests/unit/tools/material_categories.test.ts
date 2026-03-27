import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, getErrorText } from "../../helpers/call-tool.js";
import { materialCategoryFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("material_categories", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_material_categories", () => {
    it("calls GET /material_categories", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { categories: [materialCategoryFixture] } });
      await mcpClient.callTool({ name: "list_material_categories", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/material_categories", { params: expect.any(Object) });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_material_categories", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
