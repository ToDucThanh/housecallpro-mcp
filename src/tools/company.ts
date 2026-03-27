import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { client } from "../client.js";

export function registerCompanyTools(server: McpServer): void {
  server.registerTool(
    "get_company",
    { description: "Get company information and settings" },
    async () => {
      try {
        const response = await client.get("/company");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
