import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { client, logger } from "../client.js";
import { fetchAllPages } from "../utils/pagination.js";
import { uuidSchema, isoDateTimeSchema, paginationSchema, sortDirectionSchema } from "../utils/validation.js";

export function registerJobTools(server: McpServer): void {
  server.registerTool(
    "list_jobs",
    {
      description: "Get a paginated list of jobs with optional filters. Set fetch_all:true to retrieve all pages automatically.",
      inputSchema: {
        scheduled_start_min: isoDateTimeSchema.optional(),
        scheduled_start_max: isoDateTimeSchema.optional(),
        scheduled_end_min: isoDateTimeSchema.optional(),
        scheduled_end_max: isoDateTimeSchema.optional(),
        employee_ids: z.array(z.string()).optional(),
        customer_id: uuidSchema.optional(),
        ...paginationSchema,
        work_status: z.array(z.enum(["unscheduled", "scheduled", "in_progress", "completed", "canceled"])).optional(),
        sort_by: z.enum(["created_at", "updated_at", "invoice_number", "id", "description", "work_status"]).optional(),
        sort_direction: sortDirectionSchema,
        location_ids: z.array(z.string()).optional(),
        expand: z.array(z.enum(["attachments", "appointments"])).optional(),
        fetch_all: z.boolean().optional().default(false),
      },
    },
    async ({ fetch_all, ...params }) => {
      try {
        let data: any;
        if (fetch_all) {
          const items = await fetchAllPages(
            (page) => client.get("/jobs", { params: { ...params, page } }),
            "jobs"
          );
          data = { jobs: items, total_items: items.length };
        } else {
          const response = await client.get("/jobs", { params });
          data = response.data;
        }
        const count = Array.isArray(data.jobs) ? data.jobs.length : undefined;
        if (count !== undefined) logger.debug(`list_jobs returned ${count} items`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        logger.error("list_jobs failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_job",
    {
      description: "Get a single job by ID",
      inputSchema: {
        id: uuidSchema,
        expand: z.array(z.enum(["attachments", "appointments"])).optional(),
      },
    },
    async ({ id, expand }) => {
      try {
        const response = await client.get(`/jobs/${id}`, {
          params: expand ? { expand } : undefined,
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_job failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_job",
    {
      description: "Create a new job for an existing customer and address",
      inputSchema: {
        customer_id: uuidSchema,
        address_id: uuidSchema,
        start_time: isoDateTimeSchema.optional(),
        end_time: isoDateTimeSchema.optional(),
        arrival_window_in_minutes: z.number().optional(),
        job_type_id: z.string().optional(),
        tags: z.array(z.string()).optional(),
        lead_source: z.string().optional(),
        note: z.string().optional(),
        invoice_number: z.string().optional(),
      },
    },
    async (body) => {
      try {
        const response = await client.post("/jobs", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_job failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_job_schedule",
    {
      description: "Update a job's schedule",
      inputSchema: {
        job_id: uuidSchema,
        start_time: isoDateTimeSchema,
        end_time: isoDateTimeSchema.optional(),
        arrival_window_in_minutes: z.number().optional(),
        notify: z.boolean().optional(),
        notify_pro: z.boolean().optional(),
        dispatched_employees: z.array(z.object({ employee_id: z.string().optional() })).optional(),
      },
    },
    async ({ job_id, ...body }) => {
      try {
        const response = await client.put(`/jobs/${job_id}/schedule`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("update_job_schedule failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_job_schedule",
    {
      description: "Erase the schedule on a job",
      inputSchema: {
        job_id: uuidSchema,
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.delete(`/jobs/${job_id}/schedule`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("delete_job_schedule failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "dispatch_job",
    {
      description: "Dispatch a job to employees",
      inputSchema: {
        job_id: uuidSchema,
        dispatched_employees: z.array(z.object({ employee_id: z.string() })),
      },
    },
    async ({ job_id, ...body }) => {
      try {
        const response = await client.put(`/jobs/${job_id}/dispatch`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("dispatch_job failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_job_attachment",
    {
      description: "Add a file attachment to a job",
      inputSchema: {
        job_id: uuidSchema,
        file_url: z.string().describe("URL of the file to attach"),
      },
    },
    async ({ job_id, file_url }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/attachments`, { file_url });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("add_job_attachment failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "list_job_line_items",
    {
      description: "List all line items for a job",
      inputSchema: {
        job_id: uuidSchema,
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.get(`/jobs/${job_id}/line_items`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("list_job_line_items failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_job_line_item",
    {
      description: "Add a line item to a job",
      inputSchema: {
        job_id: uuidSchema,
        name: z.string(),
        description: z.string().optional(),
        unit_price: z.number().optional(),
        quantity: z.number().optional(),
      },
    },
    async ({ job_id, ...body }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/line_items`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("add_job_line_item failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "bulk_update_job_line_items",
    {
      description: "Bulk update all line items for a job",
      inputSchema: {
        job_id: uuidSchema,
        line_items: z.array(z.object({}).passthrough()),
      },
    },
    async ({ job_id, line_items }) => {
      try {
        const response = await client.put(`/jobs/${job_id}/line_items/bulk_update`, { line_items });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("bulk_update_job_line_items failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "list_job_input_materials",
    {
      description: "List all input materials for a job",
      inputSchema: {
        job_id: uuidSchema,
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.get(`/jobs/${job_id}/job_input_materials`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("list_job_input_materials failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "bulk_update_job_input_materials",
    {
      description: "Bulk update input materials for a job",
      inputSchema: {
        job_id: uuidSchema,
        job_input_materials: z.array(z.object({}).passthrough()),
      },
    },
    async ({ job_id, job_input_materials }) => {
      try {
        const response = await client.put(`/jobs/${job_id}/job_input_materials/bulk_update`, { job_input_materials });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("bulk_update_job_input_materials failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_job_tag",
    {
      description: "Add a tag to a job",
      inputSchema: {
        job_id: uuidSchema,
        tag_id: uuidSchema,
      },
    },
    async ({ job_id, tag_id }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/tags`, { tag_id });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("add_job_tag failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "remove_job_tag",
    {
      description: "Remove a tag from a job",
      inputSchema: {
        job_id: uuidSchema,
        tag_id: uuidSchema,
      },
    },
    async ({ job_id, tag_id }) => {
      try {
        const response = await client.delete(`/jobs/${job_id}/tags/${tag_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("remove_job_tag failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_job_note",
    {
      description: "Add a note to a job",
      inputSchema: {
        job_id: uuidSchema,
        content: z.string(),
      },
    },
    async ({ job_id, content }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/notes`, { content });
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("add_job_note failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_job_note",
    {
      description: "Delete a job note",
      inputSchema: {
        job_id: uuidSchema,
        note_id: uuidSchema,
      },
    },
    async ({ job_id, note_id }) => {
      try {
        const response = await client.delete(`/jobs/${job_id}/notes/${note_id}`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("delete_job_note failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_job_link",
    {
      description: "Create a link on a job",
      inputSchema: {
        job_id: uuidSchema,
        name: z.string(),
        url: z.string(),
      },
    },
    async ({ job_id, ...body }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/links`, body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("create_job_link failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "lock_job",
    {
      description: "Lock a single job by ID",
      inputSchema: {
        job_id: uuidSchema,
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.post(`/jobs/${job_id}/lock`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("lock_job failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "lock_jobs_by_time_range",
    {
      description: "Lock completed or scheduled jobs within a time range",
      inputSchema: {
        start_time: isoDateTimeSchema,
        end_time: isoDateTimeSchema,
      },
    },
    async (body) => {
      try {
        const response = await client.post("/jobs/lock", body);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("lock_jobs_by_time_range failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_job_invoices",
    {
      description: "List all invoices for a job",
      inputSchema: {
        job_id: uuidSchema,
      },
    },
    async ({ job_id }) => {
      try {
        const response = await client.get(`/jobs/${job_id}/invoices`);
        return { content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }] };
      } catch (error) {
        logger.error("get_job_invoices failed", error);
        return { content: [{ type: "text", text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
