import dotenv from "dotenv";
import axios from "axios";
import axiosRetry from "axios-retry";

dotenv.config();

const authMethod = process.env.HOUSECALL_AUTH_METHOD ?? "apikey";
const DEBUG = process.env.HOUSECALL_MCP_DEBUG === "true";

// Logger — all output goes to stderr, never stdout
export const logger = {
  // Always logs — startup, auth, connection check, rate limiting
  info(message: string): void {
    process.stderr.write(`[housecallpro-mcp] ${message}\n`);
  },

  // Always logs — errors regardless of DEBUG flag
  error(message: string, error?: unknown): void {
    const detail = error instanceof Error ? error.message : String(error ?? "");
    process.stderr.write(`[housecallpro-mcp] ERROR: ${message}${detail ? ` — ${detail}` : ""}\n`);
    if (DEBUG && error instanceof Error && error.stack) {
      process.stderr.write(`[housecallpro-mcp] STACK: ${error.stack}\n`);
    }
  },

  // Only logs when HOUSECALL_MCP_DEBUG=true
  debug(message: string): void {
    if (!DEBUG) return;
    process.stderr.write(`[housecallpro-mcp] DEBUG: ${message}\n`);
  },

  // Only logs when HOUSECALL_MCP_DEBUG=true
  request(method: string, url: string): void {
    if (!DEBUG) return;
    process.stderr.write(`[housecallpro-mcp] → ${method.toUpperCase()} ${url}\n`);
  },

  // Only logs when HOUSECALL_MCP_DEBUG=true
  response(status: number, url: string, durationMs: number): void {
    if (!DEBUG) return;
    process.stderr.write(`[housecallpro-mcp] ← ${status} ${url} (${durationMs}ms)\n`);
  },

  // Only logs when HOUSECALL_MCP_DEBUG=true
  retry(attempt: number, maxRetries: number, method: string, url: string): void {
    if (!DEBUG) return;
    process.stderr.write(`[housecallpro-mcp] RETRY: attempt ${attempt}/${maxRetries} — ${method.toUpperCase()} ${url}\n`);
  },
};

function getAuthHeader(): string {
  if (authMethod === "oauth") {
    const token = process.env.HOUSECALL_OAUTH_TOKEN;
    if (!token) throw new Error("HOUSECALL_OAUTH_TOKEN is not set");
    return `Bearer ${token}`;
  }
  const apiKey = process.env.HOUSECALL_API_KEY;
  if (!apiKey) throw new Error("HOUSECALL_API_KEY is not set");
  return `Token ${apiKey}`;
}

export const client = axios.create({
  baseURL: "https://api.housecallpro.com",
});

// Retry logic
axiosRetry(client, {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount - 1) * 1000, // 1s, 2s, 4s
  retryCondition: (error) => {
    if (axiosRetry.isNetworkError(error)) return true;
    const status = error.response?.status;
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  },
  onRetry: (retryCount, error) => {
    const method = error.config?.method?.toUpperCase() ?? "?";
    const url = error.config?.url ?? "?";

    // Respect Retry-After header on 429 — always log rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      if (retryAfter) {
        const waitMs = parseFloat(retryAfter) * 1000;
        logger.info(`Rate limited — waiting ${waitMs}ms (Retry-After)`);
        return new Promise((resolve) => setTimeout(resolve, waitMs)) as unknown as void;
      }
    }

    logger.retry(retryCount, 3, method, url);
  },
});

// Auth + timing interceptors
client.interceptors.request.use((config) => {
  config.headers["Authorization"] = getAuthHeader();
  (config as any)._startTime = Date.now();
  logger.request(config.method ?? "?", config.url ?? "?");
  return config;
});

client.interceptors.response.use(
  (response) => {
    const startTime = (response.config as any)._startTime;
    const durationMs = startTime ? Date.now() - startTime : 0;
    logger.response(response.status, response.config.url ?? "?", durationMs);
    return response;
  },
  (error) => {
    const startTime = (error.config as any)?._startTime;
    const durationMs = startTime ? Date.now() - startTime : 0;
    const url = error.config?.url ?? "?";
    const status = error.response?.status ?? 0;
    if (durationMs) logger.response(status, url, durationMs);

    const data = error.response?.data;
    const message =
      data?.message ??
      data?.error?.message ??
      error.response?.statusText ??
      error.message ??
      "Unknown error";
    const statusCode = error.response?.status ?? "unknown";
    throw new Error(`HCP API Error (${statusCode}): ${message}`);
  }
);

export async function checkConnection(): Promise<void> {
  try {
    await client.get("/company");
    logger.info("✓ HCP API connection verified");
  } catch (error) {
    logger.error("✗ HCP API connection failed — check your API key in .env", error);
  }
}
