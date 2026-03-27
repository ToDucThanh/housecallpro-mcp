import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerInvoiceTools(server: McpServer): void {
  server.registerTool(
    "list_invoices",
    {
      description: "Get a paginated list of invoices. Set fetch_all:true to retrieve all pages automatically.",
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
            (page) => client.get("/invoices", { params: { ...params, page } }),
            "invoices"
          );
          data = { invoices: items, total_items: items.length };
        } else {
          const response = await client.get("/invoices", { params });
          data = response.data;
        }
        const count = Array.isArray(data.invoices) ? data.invoices.length : undefined;
        if (count !== undefined) logger.debug(`list_invoices returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_invoices failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
