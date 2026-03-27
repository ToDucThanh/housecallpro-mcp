import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerPipelineTools(server: McpServer): void {
  server.registerTool(
    "list_pipeline_statuses",
    {
      description: "Get all pipeline statuses for leads, jobs, or estimates",
      inputSchema: {
        resource_type: z.enum(["lead", "job", "estimate"]),
        page: z.number().optional(),
        page_size: z.number().optional(),
      },
    },
    async (params) => {
      try {
        const response = await client.get("/pipeline/statuses", { params });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );

  server.registerTool(
    "update_pipeline_status",
    {
      description: "Move a resource forward in the pipeline",
      inputSchema: {
        resource_type: z.enum(["lead", "job", "estimate"]),
        resource_id: z.string(),
        status_id: z.string(),
      },
    },
    async (body) => {
      try {
        const response = await client.put("/pipeline/status", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
