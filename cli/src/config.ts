import { join } from 'path'
import { readFile, writeFile, mkdir, chmod } from 'fs/promises'
import { homedir } from 'os'
import type { Config, HcpAuth, HcpApiKeyAuth, HcpOAuthAuth, ClaudeAuth, ClaudeApiKeyAuth, ClaudeSubscriptionAuth } from './config.types.js'

export type { Config, HcpAuth, HcpApiKeyAuth, HcpOAuthAuth, ClaudeAuth, ClaudeApiKeyAuth, ClaudeSubscriptionAuth } from './config.types.js'

export function configPath(): string {
  const dir = process.env.HCPRO_CONFIG_DIR ?? join(homedir(), '.config', 'hcpro')
  return join(dir, 'config.json')
}

export async function readConfig(): Promise<Config> {
  try {
    const raw = await readFile(configPath(), 'utf-8')
    return JSON.parse(raw) as Config
  } catch {
    return {}
  }
}

export async function writeConfig(patch: Partial<Config>): Promise<void> {
  const path = configPath()
  await mkdir(join(path, '..'), { recursive: true })
  const existing = await readConfig()
  const merged: Config = { ...existing, ...patch }
  await writeFile(path, JSON.stringify(merged, null, 2), 'utf-8')
  await chmod(path, 0o600)
}
