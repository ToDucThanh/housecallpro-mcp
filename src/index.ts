import dotenv from "dotenv";
dotenv.config();

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logger, checkConnection } from "./client.js";

const DEBUG = process.env.HOUSECALL_MCP_DEBUG === "true";
const authMethod = process.env.HOUSECALL_AUTH_METHOD ?? "apikey";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason instanceof Error ? reason : new Error(String(reason)));
  // Do not exit — MCP servers should stay alive
});

process.on("SIGTERM", () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

const server = createServer();

const toolCount = (server as any)._registeredTools
  ? Object.keys((server as any)._registeredTools).length
  : "?";

logger.info("Server starting — Housecall Pro MCP v0.1.0");
logger.info(`Auth method: ${authMethod}`);
logger.info(`Debug mode: ${DEBUG ? "enabled (HOUSECALL_MCP_DEBUG=true)" : "disabled"}`);
logger.info(`Tools registered: ${toolCount}`);

await checkConnection();

const transport = new StdioServerTransport();
await server.connect(transport);
