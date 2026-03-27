import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { estimateFixture, customerFixture, addressFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedGet = client.get as ReturnType<typeof vi.fn>;
const mockedPost = client.post as ReturnType<typeof vi.fn>;

describe("estimates", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_estimates", () => {
    it("calls GET /estimates with no params", async () => {
      mockedGet.mockResolvedValueOnce({ data: [estimateFixture] });

      const result = await mcpClient.callTool({ name: "list_estimates", arguments: {} });
      const parsed = parseResult(result);

      expect(mockedGet).toHaveBeenCalledWith("/estimates", { params: {} });
      expect(parsed).toEqual([estimateFixture]);
    });

    it("passes pagination params", async () => {
      mockedGet.mockResolvedValueOnce({ data: [estimateFixture] });

      await mcpClient.callTool({
        name: "list_estimates",
        arguments: { page: 2, page_size: 15 },
      });

      expect(mockedGet).toHaveBeenCalledWith("/estimates", {
        params: { page: 2, page_size: 15 },
      });
    });

    it("passes schedule filter params", async () => {
      mockedGet.mockResolvedValueOnce({ data: [estimateFixture] });

      await mcpClient.callTool({
        name: "list_estimates",
        arguments: {
          scheduled_start_min: "2024-01-01T00:00:00Z",
          scheduled_start_max: "2024-12-31T23:59:59Z",
          sort_direction: "asc",
        },
      });

      expect(mockedGet).toHaveBeenCalledWith("/estimates", {
        params: {
          scheduled_start_min: "2024-01-01T00:00:00Z",
          scheduled_start_max: "2024-12-31T23:59:59Z",
          sort_direction: "asc",
        },
      });
    });

    it("passes customer_id filter param", async () => {
      mockedGet.mockResolvedValueOnce({ data: [estimateFixture] });

      await mcpClient.callTool({
        name: "list_estimates",
        arguments: { customer_id: customerFixture.id },
      });

      expect(mockedGet).toHaveBeenCalledWith("/estimates", {
        params: { customer_id: customerFixture.id },
      });
    });

    it("passes work_status array filter", async () => {
      mockedGet.mockResolvedValueOnce({ data: [estimateFixture] });

      await mcpClient.callTool({
        name: "list_estimates",
        arguments: { work_status: ["scheduled", "in_progress"] },
      });

      expect(mockedGet).toHaveBeenCalledWith("/estimates", {
        params: { work_status: ["scheduled", "in_progress"] },
      });
    });

    it("returns error text on failure", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Server error"));

      const result = await mcpClient.callTool({ name: "list_estimates", arguments: {} });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Server error");
    });
  });

  describe("get_estimate", () => {
    it("calls GET /estimates/:id", async () => {
      mockedGet.mockResolvedValueOnce({ data: estimateFixture });

      const result = await mcpClient.callTool({
        name: "get_estimate",
        arguments: { id: estimateFixture.id },
      });
      const parsed = parseResult(result);

      expect(mockedGet).toHaveBeenCalledWith(`/estimates/${estimateFixture.id}`);
      expect(parsed).toEqual(estimateFixture);
    });

    it("returns error text on failure", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await mcpClient.callTool({
        name: "get_estimate",
        arguments: { id: "nonexistent_estimate" },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Not found");
    });
  });

  describe("create_estimate", () => {
    it("calls POST /estimates with required fields", async () => {
      mockedPost.mockResolvedValueOnce({ data: estimateFixture });

      const result = await mcpClient.callTool({
        name: "create_estimate",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
          options: [{ name: "Option 1" }],
        },
      });
      const parsed = parseResult(result);

      expect(mockedPost).toHaveBeenCalledWith("/estimates", {
        customer_id: customerFixture.id,
        address_id: addressFixture.id,
          options: [{ name: "Option 1" }],
      });
      expect(parsed).toEqual(estimateFixture);
    });

    it("calls POST /estimates with all optional fields", async () => {
      mockedPost.mockResolvedValueOnce({ data: estimateFixture });

      const result = await mcpClient.callTool({
        name: "create_estimate",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
          options: [{ name: "Option 1" }],
          lead_source: "referral",
          note: "Please call ahead",
          schedule: { start_time: "2024-06-01T09:00:00Z", end_time: "2024-06-01T11:00:00Z" },
          estimate_fields: { job_type_id: "jt_abc123" },
        },
      });
      const parsed = parseResult(result);

      expect(mockedPost).toHaveBeenCalledWith("/estimates", expect.objectContaining({
        customer_id: customerFixture.id,
        address_id: addressFixture.id,
        options: [{ name: "Option 1" }],
        lead_source: "referral",
        note: "Please call ahead",
      }));
      expect(parsed).toEqual(estimateFixture);
    });

    it("sends customer_id and address_id in the request body", async () => {
      mockedPost.mockResolvedValueOnce({ data: estimateFixture });

      await mcpClient.callTool({
        name: "create_estimate",
        arguments: {
          customer_id: customerFixture.id,
          address_id: addressFixture.id,
          options: [{ name: "Option 1" }],
        },
      });

      const [url, body] = mockedPost.mock.calls[0];
      expect(url).toBe("/estimates");
      expect(body).toHaveProperty("customer_id", customerFixture.id);
      expect(body).toHaveProperty("address_id", addressFixture.id);
    });

    it("returns error text on failure", async () => {
      mockedPost.mockRejectedValueOnce(new Error("Invalid address"));

      const result = await mcpClient.callTool({
        name: "create_estimate",
        arguments: {
          customer_id: customerFixture.id,
          address_id: "bad_address",
          options: [{ name: "Option 1" }],
        },
      });
      const text = getErrorText(result);

      expect(text).toContain("Error:");
      expect(text).toContain("Invalid address");
    });
  });
});
