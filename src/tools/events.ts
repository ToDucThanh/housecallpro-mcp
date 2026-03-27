import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerEventTools(server: McpServer): void {
  server.registerTool(
    "list_events",
    {
      description: "Get a paginated list of events. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        ...paginationSchema,
        sort_by: z.enum(["name", "note", "created_at", "updated_at", "street", "street_line_2", "city", "state", "zip"]).optional(),
        sort_direction: sortDirectionSchema,
        location_ids: z.array(z.string()).optional(),
        fetch_all: z.boolean().optional().default(false),
      },
    },
    async ({ fetch_all, ...params }) => {
      try {
        let data: any;
        if (fetch_all) {
          const items = await fetchAllPages(
            (page) => client.get("/events", { params: { ...params, page } }),
            "events"
          );
          data = { events: items, total_items: items.length };
        } else {
          const response = await client.get("/events", { params });
          data = response.data;
        }
        const count = Array.isArray(data.events) ? data.events.length : undefined;
        if (count !== undefined) logger.debug(`list_events returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_events failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_event",
    {
      description: "Get a single event by ID",
      inputSchema: {
        event_id: uuidSchema,
      },
    },
    async ({ event_id }) => {
      try {
        const response = await client.get(`/events/${event_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_event failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
