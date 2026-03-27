import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerPriceBookTools(server: McpServer): void {
  server.registerTool(
    "list_pricebook_services",
    {
      description: "Get a paginated list of price book services. Set fetch_all:true to retrieve all pages automatically.",
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
            (page) => client.get("/price_book/services", { params: { ...params, page } }),
            "services"
          );
          data = { services: items, total_items: items.length };
        } else {
          const response = await client.get("/price_book/services", { params });
          data = response.data;
        }
        const count = Array.isArray(data.services) ? data.services.length : undefined;
        if (count !== undefined) logger.debug(`list_pricebook_services returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_pricebook_services failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_pricebook_service",
    {
      description: "Get a single price book service by ID",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.get(`/price_book/services/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_pricebook_service failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_pricebook_service",
    {
      description: "Create a new price book service",
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
        unit_price: z.number().optional(),
        online_booking: z.boolean().optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/price_book/services", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_pricebook_service failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_pricebook_service",
    {
      description: "Update an existing price book service",
      inputSchema: {
        id: uuidSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        unit_price: z.number().optional(),
        online_booking: z.boolean().optional(),
      },
    },
    async ({ id, ...body }) => {
      try {
        const response = await client.put(`/price_book/services/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("update_pricebook_service failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_pricebook_service",
    {
      description: "Delete a price book service",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.delete(`/price_book/services/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("delete_pricebook_service failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
