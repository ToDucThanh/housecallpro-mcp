import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { applicationFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedGet = client.get as ReturnType<typeof vi.fn>;
const mockedPost = client.post as ReturnType<typeof vi.fn>;

describe("application", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("get_application", () => {
    it("calls GET /application and returns application data", async () => {
      mockedGet.mockResolvedValueOnce({ data: applicationFixture });

      const result = await mcpClient.callTool({ name: "get_application", arguments: {} });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/application");
      expect(data.id).toBe(applicationFixture.id);
      expect(data.status).toBe(applicationFixture.status);
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Unauthorized"));

      const result = await mcpClient.callTool({ name: "get_application", arguments: {} });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Unauthorized/);
    });
  });

  describe("enable_application", () => {
    it("calls POST /application/enable and returns response data", async () => {
      mockedPost.mockResolvedValueOnce({ data: { ...applicationFixture, status: "active" } });

      const result = await mcpClient.callTool({ name: "enable_application", arguments: {} });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledOnce();
      expect(mockedPost).toHaveBeenCalledWith("/application/enable");
      expect(data.status).toBe("active");
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Already enabled"));

      const result = await mcpClient.callTool({ name: "enable_application", arguments: {} });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Already enabled/);
    });
  });

  describe("disable_application", () => {
    it("calls POST /application/disable and returns response data", async () => {
      mockedPost.mockResolvedValueOnce({ data: { ...applicationFixture, status: "inactive" } });

      const result = await mcpClient.callTool({ name: "disable_application", arguments: {} });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledOnce();
      expect(mockedPost).toHaveBeenCalledWith("/application/disable");
      expect(data.status).toBe("inactive");
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Already disabled"));

      const result = await mcpClient.callTool({ name: "disable_application", arguments: {} });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Already disabled/);
    });
  });
});
