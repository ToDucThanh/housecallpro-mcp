import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../../src/server.js";

export interface TestClient {
  client: Client;
  cleanup: () => Promise<void>;
}

export async function createTestClient(): Promise<TestClient> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);
  const mcpClient = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  await mcpClient.connect(clientTransport);
  return {
    client: mcpClient,
    cleanup: async () => {
      await mcpClient.close();
    },
  };
}

export function parseResult(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const item = result.content[0] as { type: string; text: string };
  if (item.text.startsWith("Error:")) throw new Error(item.text);
  return JSON.parse(item.text);
}

export function getErrorText(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const item = result.content[0] as { type: string; text: string };
  return item.text;
}
