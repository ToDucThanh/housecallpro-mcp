import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

vi.mock("../../../src/client.js", () => ({
  client: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { client } from "../../../src/client.js";
import { createTestClient, parseResult, getErrorText } from "../../helpers/call-tool.js";
import { pipelineStatusFixture } from "../../helpers/fixtures.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

const mockedGet = client.get as ReturnType<typeof vi.fn>;
const mockedPut = client.put as ReturnType<typeof vi.fn>;

describe("pipeline", () => {
  let mcpClient: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const result = await createTestClient();
    mcpClient = result.client;
    cleanup = result.cleanup;
  });

  afterAll(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  describe("list_pipeline_statuses", () => {
    it("calls GET /pipeline/statuses with no params", async () => {
      mockedGet.mockResolvedValueOnce({ data: { statuses: [pipelineStatusFixture] } });

      const result = await mcpClient.callTool({
        name: "list_pipeline_statuses",
        arguments: { resource_type: "job" },
      });
      const data = parseResult(result) as any;

      expect(mockedGet).toHaveBeenCalledOnce();
      expect(mockedGet).toHaveBeenCalledWith("/pipeline/statuses", { params: { resource_type: "job" } });
      expect(data.statuses[0].id).toBe(pipelineStatusFixture.id);
    });

    it("passes resource_type param when provided", async () => {
      mockedGet.mockResolvedValueOnce({ data: { statuses: [pipelineStatusFixture] } });

      await mcpClient.callTool({
        name: "list_pipeline_statuses",
        arguments: { resource_type: "lead" },
      });

      expect(mockedGet).toHaveBeenCalledWith("/pipeline/statuses", {
        params: { resource_type: "lead" },
      });
    });

    it("accepts job as resource_type", async () => {
      mockedGet.mockResolvedValueOnce({ data: { statuses: [] } });

      await mcpClient.callTool({
        name: "list_pipeline_statuses",
        arguments: { resource_type: "job" },
      });

      expect(mockedGet).toHaveBeenCalledWith("/pipeline/statuses", {
        params: { resource_type: "job" },
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedGet.mockRejectedValueOnce(new Error("Service unavailable"));

      const result = await mcpClient.callTool({
        name: "list_pipeline_statuses",
        arguments: { resource_type: "job" },
      });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Service unavailable/);
    });
  });

  describe("update_pipeline_status", () => {
    it("calls PUT /pipeline/status with all three fields in the body", async () => {
      mockedPut.mockResolvedValueOnce({ data: pipelineStatusFixture });

      const result = await mcpClient.callTool({
        name: "update_pipeline_status",
        arguments: {
          resource_type: "lead",
          resource_id: "lead_abc",
          status_id: pipelineStatusFixture.id,
        },
      });
      const data = parseResult(result) as any;

      expect(mockedPut).toHaveBeenCalledOnce();
      expect(mockedPut).toHaveBeenCalledWith("/pipeline/status", {
        resource_type: "lead",
        resource_id: "lead_abc",
        status_id: pipelineStatusFixture.id,
      });
      expect(data.id).toBe(pipelineStatusFixture.id);
    });

    it("works for estimate resource type", async () => {
      mockedPut.mockResolvedValueOnce({ data: pipelineStatusFixture });

      await mcpClient.callTool({
        name: "update_pipeline_status",
        arguments: {
          resource_type: "estimate",
          resource_id: "est_xyz",
          status_id: "ps_new",
        },
      });

      expect(mockedPut).toHaveBeenCalledWith("/pipeline/status", {
        resource_type: "estimate",
        resource_id: "est_xyz",
        status_id: "ps_new",
      });
    });

    it("returns an error message when the client throws", async () => {
      mockedPut.mockRejectedValueOnce(new Error("Invalid status_id"));

      const result = await mcpClient.callTool({
        name: "update_pipeline_status",
        arguments: {
          resource_type: "job",
          resource_id: "job_123",
          status_id: "ps_bad",
        },
      });
      const text = getErrorText(result);

      expect(text).toMatch(/Error:.*Invalid status_id/);
    });
  });
});
