import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { employeeFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("employees", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_employees", () => {
    it("calls GET /employees with no params", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { employees: [employeeFixture] } });
      const result = await mcpClient.callTool({ name: "list_employees", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/employees", { params: expect.any(Object) });
      expect(parseResult(result)).toMatchObject({ employees: expect.any(Array) });
    });

    it("passes location_ids filter", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { employees: [] } });
      await mcpClient.callTool({ name: "list_employees", arguments: { location_ids: ["loc_1"] } });
      expect(client.get).toHaveBeenCalledWith("/employees", {
        params: expect.objectContaining({ location_ids: ["loc_1"] }),
      });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (403): Forbidden"));
      const result = await mcpClient.callTool({ name: "list_employees", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
