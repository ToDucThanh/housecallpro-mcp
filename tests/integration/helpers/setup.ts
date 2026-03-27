import { afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../../src/server.js";

type TrackedResource = { type: string; id: string; meta?: Record<string, string> };

const createdResources: TrackedResource[] = [];

export function track(type: string, id: string, meta?: Record<string, string>): void {
  createdResources.push({ type, id, meta });
}

let _client: Client | null = null;

export async function getClient(): Promise<Client> {
  if (_client) return _client;

  const authMethod = process.env.HOUSECALL_AUTH_METHOD ?? "apikey";
  if (authMethod === "oauth") {
    if (!process.env.HOUSECALL_OAUTH_TOKEN) {
      throw new Error("Integration tests require HOUSECALL_OAUTH_TOKEN to be set");
    }
  } else {
    if (!process.env.HOUSECALL_API_KEY) {
      throw new Error("Integration tests require HOUSECALL_API_KEY to be set");
    }
  }

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);
  _client = new Client({ name: "integration-test-client", version: "1.0.0" }, { capabilities: {} });
  await _client.connect(clientTransport);
  return _client;
}

export function callTool(name: string, args: Record<string, unknown> = {}) {
  return getClient().then((c) => c.callTool({ name, arguments: args }));
}

export function parseResult(result: Awaited<ReturnType<Client["callTool"]>>): Record<string, unknown> {
  const item = result.content[0] as { type: string; text: string };
  // Catch all error-like prefixes (tool errors, MCP protocol errors, etc.)
  if (!item.text.startsWith("{") && !item.text.startsWith("[")) {
    throw new Error(item.text);
  }
  return JSON.parse(item.text) as Record<string, unknown>;
}

afterAll(async () => {
  const client = await getClient().catch(() => null);
  if (!client) return;

  // Delete in reverse order to respect dependencies (jobs before customers, etc.)
  for (const resource of [...createdResources].reverse()) {
    try {
      const toolMap: Record<string, [string, Record<string, string>]> = {
        job: ["get_job", { id: resource.id }],
        customer: ["update_customer", { customer_id: resource.id }],
        material: ["delete_material", { id: resource.id }],
        tag: ["delete_tag", { tag_id: resource.id }],
        pricebook_service: ["delete_pricebook_service", { id: resource.id }],
        webhook: ["delete_webhook_subscription", {}],
      };
      const entry = toolMap[resource.type];
      if (entry) {
        const [toolName, args] = entry;
        if (toolName.startsWith("delete_")) {
          await client.callTool({ name: toolName, arguments: args });
        }
      }
    } catch {
      // Best-effort cleanup — don't fail the test suite on cleanup errors
    }
  }

  await client.close();
  _client = null;
});
