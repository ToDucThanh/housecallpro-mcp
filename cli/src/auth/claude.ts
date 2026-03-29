import { readConfig, writeConfig } from '../config.js'

export async function saveClaudeApiKey(apiKey: string): Promise<void> {
  await writeConfig({ claude: { authMethod: 'apikey', apiKey } })
}

export async function saveClaudeSubscription(): Promise<void> {
  await writeConfig({ claude: { authMethod: 'subscription' } })
}

export async function getClaudeEnvVars(): Promise<Record<string, string>> {
  const config = await readConfig()
  const claude = config.claude
  if (!claude) throw new Error('Claude credentials not configured. Run: hcpro auth claude login')

  if (claude.authMethod === 'apikey') {
    return { ANTHROPIC_API_KEY: claude.apiKey }
  }

  // Subscription: Claude Code uses its own stored OAuth token — no env var needed
  return {}
}

export async function loginClaudeSubscription(): Promise<void> {
  const { $ } = await import('bun')
  console.log('Opening Claude Code authentication...')
  await $`claude auth login`
  await saveClaudeSubscription()
  console.log('Claude subscription auth saved.')
}
