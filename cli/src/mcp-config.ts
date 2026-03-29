import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

interface McpConfig {
  mcpServers: {
    [name: string]: {
      command: string
      args: string[]
      env: Record<string, string>
    }
  }
}

export function buildMcpConfig(
  command: string,
  commandArgs: string[],
  env: Record<string, string>
): McpConfig {
  return {
    mcpServers: {
      'housecallpro-mcp': {
        command,
        args: [...commandArgs, '--mcp-server'],
        env,
      },
    },
  }
}

export async function writeTempMcpConfig(
  command: string,
  commandArgs: string[],
  env: Record<string, string>
): Promise<string> {
  const config = buildMcpConfig(command, commandArgs, env)
  const path = join(tmpdir(), `hcpro-mcp-config-${randomUUID()}.json`)
  await writeFile(path, JSON.stringify(config, null, 2), 'utf-8')
  return path
}
