import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerApplicationTools } from "./tools/application.js";
import { registerChecklistTools } from "./tools/checklists.js";
import { registerEmployeeTools } from "./tools/employees.js";
import { registerJobTools } from "./tools/jobs.js";
import { registerJobAppointmentTools } from "./tools/job_appointments.js";
import { registerEstimateTools } from "./tools/estimates.js";
import { registerInvoiceTools } from "./tools/invoices.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerLeadSourceTools } from "./tools/lead_sources.js";
import { registerWebhookTools } from "./tools/webhooks.js";
import { registerMaterialTools } from "./tools/materials.js";
import { registerMaterialCategoryTools } from "./tools/material_categories.js";
import { registerPriceFormTools } from "./tools/price_forms.js";
import { registerPriceBookTools } from "./tools/price_book.js";
import { registerJobTypeTools } from "./tools/job_types.js";
import { registerServiceZoneTools } from "./tools/service_zones.js";
import { registerPipelineTools } from "./tools/pipeline.js";
import { registerRouteTools } from "./tools/routes.js";
import { registerCompanyTools } from "./tools/company.js";
import { registerScheduleTools } from "./tools/schedule.js";
import { registerEventTools } from "./tools/events.js";
import { registerTagTools } from "./tools/tags.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "housecallpro-mcp",
    version: "0.1.0",
  });

  registerCustomerTools(server);
  registerApplicationTools(server);
  registerChecklistTools(server);
  registerEmployeeTools(server);
  registerJobTools(server);
  registerJobAppointmentTools(server);
  registerEstimateTools(server);
  registerInvoiceTools(server);
  registerLeadTools(server);
  registerLeadSourceTools(server);
  registerWebhookTools(server);
  registerMaterialTools(server);
  registerMaterialCategoryTools(server);
  registerPriceFormTools(server);
  registerPriceBookTools(server);
  registerJobTypeTools(server);
  registerServiceZoneTools(server);
  registerPipelineTools(server);
  registerRouteTools(server);
  registerCompanyTools(server);
  registerScheduleTools(server);
  registerEventTools(server);
  registerTagTools(server);

  return server;
}
