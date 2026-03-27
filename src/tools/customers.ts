import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, phoneSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerCustomerTools(server: McpServer): void {
  server.registerTool(
    "list_customers",
    {
      description: "Get a paginated list of customers. Search by name, email, mobile number or address using q. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        q: z.string().optional(),
        ...paginationSchema,
        sort_by: z.string().optional().default("created_at"),
        sort_direction: sortDirectionSchema,
        location_ids: z.array(z.string()).optional(),
        expand: z.array(z.enum(["attachments", "do_not_service"])).optional(),
        fetch_all: z.boolean().optional().default(false),
      },
    },
    async ({ fetch_all, ...params }) => {
      try {
        let data: any;
        if (fetch_all) {
          const items = await fetchAllPages(
            (page) => client.get("/customers", { params: { ...params, page } }),
            "customers"
          );
          data = { customers: items, total_items: items.length };
        } else {
          const response = await client.get("/customers", { params });
          data = response.data;
        }
        const count = Array.isArray(data.customers) ? data.customers.length : undefined;
        if (count !== undefined) logger.debug(`list_customers returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_customers failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_customer",
    {
      description: "Get a single customer by their ID.",
      inputSchema: {
        customer_id: uuidSchema,
        expand: z.array(z.enum(["attachments", "do_not_service"])).optional(),
      },
    },
    async ({ customer_id, expand }) => {
      try {
        const response = await client.get(`/customers/${customer_id}`, {
          params: expand ? { expand } : undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_customer failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_customer",
    {
      description: "Create a new customer. At least one of first_name, last_name, email, mobile_number, home_number, or work_number is required.",
      inputSchema: {
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().optional(),
        mobile_number: phoneSchema,
        home_number: phoneSchema,
        work_number: phoneSchema,
        company: z.string().optional(),
        notifications_enabled: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        lead_source: z.string().optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/customers", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_customer failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_customer",
    {
      description: "Update an existing customer's attributes.",
      inputSchema: {
        customer_id: uuidSchema,
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.string().optional(),
        mobile_number: phoneSchema,
        home_number: phoneSchema,
        work_number: phoneSchema,
        company: z.string().optional(),
        notifications_enabled: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        lead_source: z.string().optional(),
      },
    },
    async ({ customer_id, ...body }) => {
      try {
        const response = await client.put(`/customers/${customer_id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("update_customer failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "list_customer_addresses",
    {
      description: "Get all addresses for a customer.",
      inputSchema: {
        customer_id: uuidSchema,
        page: z.number().optional(),
        page_size: z.number().optional(),
        sort_by: z.enum(["created_at", "updated_at"]).optional(),
        sort_direction: sortDirectionSchema,
      },
    },
    async ({ customer_id, ...params }) => {
      try {
        const response = await client.get(`/customers/${customer_id}/addresses`, { params });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("list_customer_addresses failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_customer_address",
    {
      description: "Get a specific address for a customer by address ID.",
      inputSchema: {
        customer_id: uuidSchema,
        address_id: uuidSchema,
      },
    },
    async ({ customer_id, address_id }) => {
      try {
        const response = await client.get(`/customers/${customer_id}/addresses/${address_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_customer_address failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_customer_address",
    {
      description: "Create a new address on an existing customer.",
      inputSchema: {
        customer_id: uuidSchema,
        street: z.string(),
        street_line_2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        country: z.string().optional(),
      },
    },
    async ({ customer_id, ...body }) => {
      try {
        const response = await client.post(`/customers/${customer_id}/addresses`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_customer_address failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
