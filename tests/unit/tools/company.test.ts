import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { companyFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("company", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("get_company", () => {
    it("calls GET /company", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: companyFixture });
      const result = await mcpClient.callTool({ name: "get_company", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/company");
      expect(parseResult(result)).toMatchObject({ id: "company_test123" });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Server Error"));
      const result = await mcpClient.callTool({ name: "get_company", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
