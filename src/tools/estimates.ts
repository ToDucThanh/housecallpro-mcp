import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, isoDateTimeSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerEstimateTools(server: McpServer): void {
  server.registerTool(
    "list_estimates",
    {
      description: "Get a paginated list of estimates. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        scheduled_start_min: isoDateTimeSchema.optional(),
        scheduled_start_max: isoDateTimeSchema.optional(),
        scheduled_end_min: isoDateTimeSchema.optional(),
        scheduled_end_max: isoDateTimeSchema.optional(),
        employee_ids: z.array(z.string()).optional(),
        customer_id: uuidSchema.optional(),
        ...paginationSchema,
        work_status: z.array(z.enum(["unscheduled", "scheduled", "in_progress", "completed", "canceled"])).optional(),
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
            (page) => client.get("/estimates", { params: { ...params, page } }),
            "estimates"
          );
          data = { estimates: items, total_items: items.length };
        } else {
          const response = await client.get("/estimates", { params });
          data = response.data;
        }
        const count = Array.isArray(data.estimates) ? data.estimates.length : undefined;
        if (count !== undefined) logger.debug(`list_estimates returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_estimates failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_estimate",
    {
      description: "Get a single estimate by ID",
      inputSchema: {
        id: uuidSchema,
      },
    },
    async ({ id }) => {
      try {
        const response = await client.get(`/estimates/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_estimate failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_estimate",
    {
      description: "Create a new estimate",
      inputSchema: {
        customer_id: uuidSchema,
        address_id: uuidSchema,
        options: z.array(
          z.object({
            name: z.string(),
            tags: z.array(z.string()).optional(),
            line_items: z.array(
              z.object({
                name: z.string(),
                description: z.string().optional(),
                unit_price: z.number().optional(),
                quantity: z.number().optional(),
                unit_cost: z.number().optional(),
              })
            ).optional(),
          })
        ),
        estimate_number: z.number().optional(),
        note: z.string().optional(),
        message: z.string().optional(),
        lead_source: z.string().optional(),
        assigned_employee_ids: z.array(z.string()).optional(),
        address: z.object({
          street: z.string().optional(),
          street_line_2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
        }).optional(),
        schedule: z.object({
          start_time: isoDateTimeSchema.optional(),
          end_time: isoDateTimeSchema.optional(),
          arrival_window_in_minutes: z.number().optional(),
          notify_customer: z.boolean().optional(),
        }).optional(),
        estimate_fields: z.object({
          job_type_id: z.string().optional(),
          business_unit_id: z.string().optional(),
        }).optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/estimates", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_estimate failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
