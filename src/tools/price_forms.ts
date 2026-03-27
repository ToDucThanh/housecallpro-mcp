import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerPriceFormTools(server: McpServer): void {
  server.registerTool(
    "list_price_forms",
    {
      description: "Get a list of price forms",
      inputSchema: {
        page: z.number().optional(),
        page_size: z.number().optional(),
      },
    },
    async (params) => {
      try {
        const response = await client.get("/price_forms", { params });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
