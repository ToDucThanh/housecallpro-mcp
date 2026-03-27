import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { webhookFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedPost = client.post as ReturnType<typeof vi.fn>;
const mockedDelete = client.delete as ReturnType<typeof vi.fn>;

describe("webhooks", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("create_webhook_subscription", () => {
    it("calls POST /webhooks/subscription with url only", async () => {
      mockedPost.mockResolvedValueOnce({ data: webhookFixture });

      const result = await mcpClient.callTool({
        name: "create_webhook_subscription",
        arguments: { url: webhookFixture.url },
      });
      const data = parseResult(result) as any;

      expect(mockedPost).toHaveBeenCalledOnce();
      expect(mockedPost).toHaveBeenCalledWith("/webhooks/subscription", { url: webhookFixture.url });
      expect(data.id).toBe(webhookFixture.id);
    });

    it("calls POST /webhooks/subscription with url and events array", async () => {
      mockedPost.mockResolvedValueOnce({ data: webhookFixture });

      await mcpClient.callTool({
        name: "create_webhook_subscription",
        arguments: {
          url: webhookFixture.url,
          events: ["job.created", "job.updated"],
        },
      });

      expect(mockedPost).toHaveBeenCalledWith("/webhooks/subscription", {
        url: webhookFixture.url,
        events: ["job.created", "job.updated"],
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Invalid URL"));

      const result = await mcpClient.callTool({
        name: "create_webhook_subscription",
        arguments: { url: "not-a-url" },
      });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Invalid URL/);
    });
  });

  describe("delete_webhook_subscription", () => {
    it("calls DELETE /webhooks/subscription", async () => {
      mockedDelete.mockResolvedValueOnce({ data: {} });

      const result = await mcpClient.callTool({
        name: "delete_webhook_subscription",
        arguments: {},
      });
      parseResult(result); // should not throw

      expect(mockedDelete).toHaveBeenCalledOnce();
      expect(mockedDelete).toHaveBeenCalledWith("/webhooks/subscription");
    });

    it("returns an error message when the client throws", async () => {
      mockedDelete.mockRejectedValueOnce(new Error("Subscription not found"));

      const result = await mcpClient.callTool({
        name: "delete_webhook_subscription",
        arguments: {},
      });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Subscription not found/);
    });
  });
});
