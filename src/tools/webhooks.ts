import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client } from "../client.js";

export function registerWebhookTools(server: McpServer): void {
  server.registerTool(
    "create_webhook_subscription",
    {
      description: "Subscribe to webhook events for a company",
      inputSchema: {
        url: z.string(),
        events: z.array(z.string()).optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/webhooks/subscription", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );

  server.registerTool(
    "delete_webhook_subscription",
    { description: "Unsubscribe from webhook events for a company" },
    async () => {
      try {
        const response = await client.delete("/webhooks/subscription");
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }] };
      }
    }
  );
}
