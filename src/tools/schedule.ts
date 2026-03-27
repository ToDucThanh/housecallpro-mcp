import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { client } from "../client.js";

export function registerScheduleTools(server: McpServer): void {
  server.registerTool(
    "get_schedule_windows",
    { description: "Get the organization's business hours and bookable windows" },
    async () => {
      try {
        const response = await client.get("/schedule_windows");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
