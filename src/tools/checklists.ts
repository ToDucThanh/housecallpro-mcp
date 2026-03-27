import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerChecklistTools(server: McpServer): void {
  server.registerTool(
    "list_checklists",
    {
      description: "Get checklists for jobs or estimates",
      inputSchema: {
        job_uuids: z.array(z.string()),
        estimate_uuids: z.array(z.string()),
        page: z.number().optional().default(1),
        per_page: z.number().optional().default(10),
      },
    },
    async (params) => {
      try {
        const response = await client.get("/checklists", { params });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
