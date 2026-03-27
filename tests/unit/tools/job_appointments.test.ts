import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("job_appointments", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  // ── list_job_appointments ─────────────────────────────────────────────────

  describe("list_job_appointments", () => {
    it("calls GET /jobs/:job_id/appointments with no params argument", async () => {
      const mockAppointments = [
        { id: "appt_1", start_time: "2026-03-28T09:00:00Z", end_time: "2026-03-28T10:00:00Z" },
      ];
      vi.mocked(client.get).mockResolvedValueOnce({ data: mockAppointments });

      const result = await mcpClient.callTool({
        name: "list_job_appointments",
        arguments: { job_id: "job_test123" },
      });

      expect(client.get).toHaveBeenCalledWith("/jobs/job_test123/appointments");
      expect(client.get).toHaveBeenCalledTimes(1);
      const [, secondArg] = vi.mocked(client.get).mock.calls[0];
      expect(secondArg).toBeUndefined();
      expect(parseResult(result)).toEqual(mockAppointments);
    });

    it("uses the provided job_id in the URL path", async () => {
      vi.mocked(client.get).mockResolvedValueOnce({ data: [] });

      await mcpClient.callTool({
        name: "list_job_appointments",
        arguments: { job_id: "job_xyz_999" },
      });

      const [url] = vi.mocked(client.get).mock.calls[0];
      expect(url).toBe("/jobs/job_xyz_999/appointments");
    });

    it("returns an error message when the request fails", async () => {
      vi.mocked(client.get).mockRejectedValueOnce(new Error("Job not found"));

      const result = await mcpClient.callTool({
        name: "list_job_appointments",
        arguments: { job_id: "job_missing" },
      });

      expect(getErrorText(result)).toContain("Error: Job not found");
    });
  });
});
