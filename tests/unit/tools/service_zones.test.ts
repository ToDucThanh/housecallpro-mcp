import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, getErrorText } from "../../helpers/call-tool.js";
import { serviceZoneFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("service_zones", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_service_zones", () => {
    it("calls GET /service_zones", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { service_zones: [serviceZoneFixture] } });
      await mcpClient.callTool({ name: "list_service_zones", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/service_zones", { params: expect.any(Object) });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_service_zones", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
