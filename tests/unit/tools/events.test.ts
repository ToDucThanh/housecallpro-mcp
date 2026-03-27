import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { eventFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedGet = client.get as ReturnType<typeof vi.fn>;

describe("events", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_events", () => {
    it("calls GET /events with no params", async () => {
      mockedGet.mockResolvedValueOnce({ data: { events: [eventFixture] } });

      const result = await mcpClient.callTool({ name: "list_events", arguments: {} });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/events", { params: {} });
      expect(data.events[0].id).toBe(eventFixture.id);
    });

    it("passes pagination and sort params to GET /events", async () => {
      mockedGet.mockResolvedValueOnce({ data: { events: [] } });

      await mcpClient.callTool({
        name: "list_events",
        arguments: { page: 2, page_size: 10, sort_by: "name", sort_direction: "asc" },
      });

      expect(mockedGet).toHaveBeenCalledWith("/events", {
        params: { page: 2, page_size: 10, sort_by: "name", sort_direction: "asc" },
      });
    });

    it("passes location_ids array to GET /events", async () => {
      mockedGet.mockResolvedValueOnce({ data: { events: [] } });

      await mcpClient.callTool({
        name: "list_events",
        arguments: { location_ids: ["loc_1", "loc_2"] },
      });

      expect(mockedGet).toHaveBeenCalledWith("/events", {
        params: { location_ids: ["loc_1", "loc_2"] },
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Network failure"));

      const result = await mcpClient.callTool({ name: "list_events", arguments: {} });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Network failure/);
    });
  });

  describe("get_event", () => {
    it("calls GET /events/:event_id with the correct ID", async () => {
      mockedGet.mockResolvedValueOnce({ data: eventFixture });

      const result = await mcpClient.callTool({
        name: "get_event",
        arguments: { event_id: eventFixture.id },
      });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith(`/events/${eventFixture.id}`);
      expect(data.id).toBe(eventFixture.id);
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_event",
        arguments: { event_id: "evt_missing" },
      });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Not found/);
    });
  });
});
