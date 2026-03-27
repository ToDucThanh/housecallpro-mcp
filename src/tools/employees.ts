import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerEmployeeTools(server: McpServer): void {
  server.registerTool(
    "list_employees",
    {
      description: "Get all active employees in the organization. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        ...paginationSchema,
        sort_by: z.string().optional(),
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
            (page) => client.get("/employees", { params: { ...params, page } }),
            "employees"
          );
          data = { employees: items, total_items: items.length };
        } else {
          const response = await client.get("/employees", { params });
          data = response.data;
        }
        const count = Array.isArray(data.employees) ? data.employees.length : undefined;
        if (count !== undefined) logger.debug(`list_employees returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_employees failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
