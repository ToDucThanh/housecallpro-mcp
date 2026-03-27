import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerRouteTools(server: McpServer): void {
  server.registerTool(
    "list_routes",
    {
      description: "Get a list of routes grouping employees and their scheduled work for a date",
      inputSchema: {
        date: z.string().optional(),
        employee_ids: z.array(z.string()).optional(),
      },
    },
    async (params) => {
      try {
        const response = await client.get("/routes", { params });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
