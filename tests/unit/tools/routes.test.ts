import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, getErrorText } from "../../helpers/call-tool.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("routes", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_routes", () => {
    it("calls GET /routes with no params", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { routes: [] } });
      const result = await mcpClient.callTool({ name: "list_routes", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/routes", { params: expect.any(Object) });
    });

    it("passes date and employee_ids filters", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { routes: [] } });
      await mcpClient.callTool({ name: "list_routes", arguments: { date: "2025-04-15", employee_ids: ["emp_1"] } });
      expect(client.get).toHaveBeenCalledWith("/routes", {
        params: expect.objectContaining({ date: "2025-04-15", employee_ids: ["emp_1"] }),
      });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_routes", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
