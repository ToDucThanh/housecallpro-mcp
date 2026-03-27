import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { invoiceFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("invoices", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_invoices", () => {
    it("calls GET /invoices", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { invoices: [invoiceFixture], page: 1 } });
      const result = await mcpClient.callTool({ name: "list_invoices", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/invoices", { params: expect.any(Object) });
      expect(parseResult(result)).toMatchObject({ invoices: expect.any(Array) });
    });

    it("passes sort_direction", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { invoices: [] } });
      await mcpClient.callTool({ name: "list_invoices", arguments: { sort_direction: "desc" } });
      expect(client.get).toHaveBeenCalledWith("/invoices", {
        params: expect.objectContaining({ sort_direction: "desc" }),
      });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_invoices", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
