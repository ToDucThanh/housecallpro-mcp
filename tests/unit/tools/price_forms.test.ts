import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, getErrorText } from "../../helpers/call-tool.js";
import { priceFormFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("price_forms", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_price_forms", () => {
    it("calls GET /price_forms", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { price_forms: [priceFormFixture] } });
      const result = await mcpClient.callTool({ name: "list_price_forms", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/price_forms", { params: expect.any(Object) });
    });

    it("passes pagination params", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { price_forms: [] } });
      await mcpClient.callTool({ name: "list_price_forms", arguments: { page: 2, page_size: 5 } });
      expect(client.get).toHaveBeenCalledWith("/price_forms", {
        params: expect.objectContaining({ page: 2, page_size: 5 }),
      });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_price_forms", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
