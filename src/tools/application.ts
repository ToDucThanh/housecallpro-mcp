import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { client } from "../client.js";

export function registerApplicationTools(server: McpServer): void {
  server.registerTool(
    "get_application",
    { description: "Get the application for a company" },
    async () => {
      try {
        const response = await client.get("/application");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );

  server.registerTool(
    "enable_application",
    { description: "Enable the application for a company" },
    async () => {
      try {
        const response = await client.post("/application/enable");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );

  server.registerTool(
    "disable_application",
    { description: "Disable the application for a company" },
    async () => {
      try {
        const response = await client.post("/application/disable");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
