import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerTagTools(server: McpServer): void {
  server.registerTool(
    "list_tags",
    {
      description: "Get a paginated list of tags. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        ...paginationSchema,
        sort_by: z.enum(["created_at", "name"]).optional(),
        sort_direction: sortDirectionSchema,
        fetch_all: z.boolean().optional().default(false),
      },
    },
    async ({ fetch_all, ...params }) => {
      try {
        let data: any;
        if (fetch_all) {
          const items = await fetchAllPages(
            (page) => client.get("/tags", { params: { ...params, page } }),
            "tags"
          );
          data = { tags: items, total_items: items.length };
        } else {
          const response = await client.get("/tags", { params });
          data = response.data;
        }
        const count = Array.isArray(data.tags) ? data.tags.length : undefined;
        if (count !== undefined) logger.debug(`list_tags returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_tags failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_tag",
    {
      description: "Create a new tag",
      inputSchema: {
        name: z.string(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/tags", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_tag failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_tag",
    {
      description: "Update a tag",
      inputSchema: {
        tag_id: uuidSchema,
        name: z.string(),
      },
    },
    async ({ tag_id, ...body }) => {
      try {
        const response = await client.put(`/tags/${tag_id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("update_tag failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_tag",
    {
      description: "Delete a tag",
      inputSchema: {
        tag_id: uuidSchema,
      },
    },
    async ({ tag_id }) => {
      try {
        const response = await client.delete(`/tags/${tag_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("delete_tag failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
