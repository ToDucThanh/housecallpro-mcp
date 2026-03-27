import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerJobAppointmentTools(server: McpServer): void {
  server.registerTool(
    "list_job_appointments",
    {
      description: "List all appointments for a job",
      inputSchema: {
        job_id: z.string(),
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.get(`/jobs/${job_id}/appointments`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
