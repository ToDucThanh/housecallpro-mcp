import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, getErrorText } from "../../helpers/call-tool.js";
import { jobTypeFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("job_types", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_job_types", () => {
    it("calls GET /job_types", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: { job_types: [jobTypeFixture] } });
      await mcpClient.callTool({ name: "list_job_types", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/job_types", { params: expect.any(Object) });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "list_job_types", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
