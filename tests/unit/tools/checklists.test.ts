import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { checklistFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("checklists", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  // ── list_checklists ───────────────────────────────────────────────────────

  describe("list_checklists", () => {
    it("calls GET /checklists with job_uuids and estimate_uuids as params", async () => {
      const mockResponse = { data: { checklists: [checklistFixture] } };
      vi.mocked(client.get).mockResolvedValueOnce(mockResponse);

      const result = await mcpClient.callTool({
        name: "list_checklists",
        arguments: {
          job_uuids: ["job_uuid_1", "job_uuid_2"],
          estimate_uuids: ["est_uuid_1"],
        },
      });

      expect(client.get).toHaveBeenCalledWith("/checklists", {
        params: expect.objectContaining({
          job_uuids: ["job_uuid_1", "job_uuid_2"],
          estimate_uuids: ["est_uuid_1"],
        }),
      });
      expect(parseResult(result)).toEqual(mockResponse.data);
    });

    it("includes page and per_page in params when provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: { checklists: [] } });

      await mcpClient.callTool({
        name: "list_checklists",
        arguments: {
          job_uuids: ["job_uuid_1"],
          estimate_uuids: [],
          page: 3,
          per_page: 25,
        },
      });

      expect(client.get).toHaveBeenCalledWith("/checklists", {
        params: expect.objectContaining({
          job_uuids: ["job_uuid_1"],
          estimate_uuids: [],
          page: 3,
          per_page: 25,
        }),
      });
    });

    it("uses default page and per_page when not explicitly provided", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: { checklists: [] } });

      await mcpClient.callTool({
        name: "list_checklists",
        arguments: { job_uuids: [], estimate_uuids: [] },
      });

      expect(client.get).toHaveBeenCalledWith("/checklists", {
        params: expect.objectContaining({ page: 1, per_page: 10 }),
      });
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await mcpClient.callTool({
        name: "list_checklists",
        arguments: { job_uuids: ["job_uuid_1"], estimate_uuids: [] },
      });

      expect(getErrorText(result)).toContain("Error: Unauthorized");
    });
  });
});
