import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { scheduleWindowFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

describe("schedule", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("get_schedule_windows", () => {
    it("calls GET /schedule_windows", async () => {
      vi.mocked(client.get).mockResolvedValue({ data: scheduleWindowFixture });
      const result = await mcpClient.callTool({ name: "get_schedule_windows", arguments: {} });
      expect(client.get).toHaveBeenCalledWith("/schedule_windows");
      expect(parseResult(result)).toMatchObject({ windows: [] });
    });

    it("returns error text on API failure", async () => {
      vi.mocked(client.get).mockRejectedValue(new Error("HousecallPro API error (500): Error"));
      const result = await mcpClient.callTool({ name: "get_schedule_windows", arguments: {} });
      expect(getErrorText(result)).toContain("Error:");
    });
  });
});
