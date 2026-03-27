import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerLeadTools(server: McpServer): void {
  server.registerTool(
    "list_leads",
    {
      description: "Get a paginated list of leads. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        ...paginationSchema,
        sort_by: z.string().optional(),
        sort_direction: sortDirectionSchema,
        fetch_all: z.boolean().optional().default(false),
      },
    },
    async ({ fetch_all, ...params }) => {
      try {
        let data: any;
        if (fetch_all) {
          const items = await fetchAllPages(
            (page) => client.get("/leads", { params: { ...params, page } }),
            "leads"
          );
          data = { leads: items, total_items: items.length };
        } else {
          const response = await client.get("/leads", { params });
          data = response.data;
        }
        const count = Array.isArray(data.leads) ? data.leads.length : undefined;
        if (count !== undefined) logger.debug(`list_leads returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_leads failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_lead",
    {
      description: "Get a single lead by ID",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.get(`/leads/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_lead failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_lead",
    {
      description: "Create a new lead for an existing customer",
      inputSchema: {
        customer_id: uuidSchema,
        address_id: uuidSchema.optional(),
        note: z.string().optional(),
        lead_source: z.string().optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/leads", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_lead failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
