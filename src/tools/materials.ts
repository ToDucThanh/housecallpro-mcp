import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerMaterialTools(server: McpServer): void {
  server.registerTool(
    "list_materials",
    {
      description: "Get a paginated list of materials. Set fetch_all:true to retrieve all pages automatically.",
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
            (page) => client.get("/materials", { params: { ...params, page } }),
            "materials"
          );
          data = { materials: items, total_items: items.length };
        } else {
          const response = await client.get("/materials", { params });
          data = response.data;
        }
        const count = Array.isArray(data.materials) ? data.materials.length : undefined;
        if (count !== undefined) logger.debug(`list_materials returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_materials failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_material",
    {
      description: "Get a single material by ID",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.get(`/materials/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_material failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_material",
    {
      description: "Create a new material",
      inputSchema: {
        name: z.string(),
        price: z.number().optional(),
        unit_cost: z.number().optional(),
        description: z.string().optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/materials", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_material failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_material",
    {
      description: "Update an existing material",
      inputSchema: {
        id: uuidSchema,
        name: z.string().optional(),
        price: z.number().optional(),
        unit_cost: z.number().optional(),
        description: z.string().optional(),
      },
    },
    async ({ id, ...body }) => {
      try {
        const response = await client.put(`/materials/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("update_material failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_material",
    {
      description: "Delete a material",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.delete(`/materials/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("delete_material failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
