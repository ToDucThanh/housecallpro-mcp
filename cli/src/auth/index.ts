import type { Command } from 'commander'

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage HouseCall Pro and Claude authentication')

  auth
    .command('login')
    .description('Log in to HouseCall Pro (interactive: choose API key or OAuth)')
    .action(async () => {
      const { select } = await import('@inquirer/prompts')
      const method = await select({
        message: 'HouseCall Pro authentication method:',
        choices: [
          { name: 'API Key', value: 'apikey' },
          { name: 'OAuth 2.0', value: 'oauth' },
        ],
      })
      if (method === 'apikey') {
        const { password } = await import('@inquirer/prompts')
        const { saveHcpApiKey } = await import('./hcp.js')
        const key = await password({ message: 'HouseCall Pro API Key:' })
        await saveHcpApiKey(key)
        console.log('HCP API key saved.')
      } else {
        const { loginHcpOAuth } = await import('./hcp.js')
        await loginHcpOAuth()
      }
    })

  auth
    .command('logout')
    .description('Remove HouseCall Pro credentials')
    .action(async () => {
    const { readConfig, writeConfig } = await import('../config.js')
    const config = await readConfig()
    const { hcp: _removed, ...rest } = config
    await writeConfig({ ...rest, hcp: undefined })
    console.log('HCP credentials removed.')
    })

  auth
    .command('status')
    .description('Show current authentication status')
    .action(async () => {
      const { printAuthStatus } = await import('./status.js')
      await printAuthStatus()
    })

  const authClaude = auth
    .command('claude')
    .description('Manage Claude authentication')

  authClaude
    .command('login')
    .description('Set up Claude authentication (API key or subscription)')
    .action(async () => {
      const { select, password } = await import('@inquirer/prompts')
      const method = await select({
        message: 'Claude authentication method:',
        choices: [
          { name: 'API Key (billed per token)', value: 'apikey' },
          { name: 'Subscription (Claude.ai Pro/Max)', value: 'subscription' },
        ],
      })
      if (method === 'apikey') {
        const { saveClaudeApiKey } = await import('./claude.js')
        const key = await password({ message: 'Anthropic API Key:' })
        await saveClaudeApiKey(key)
        console.log('Claude API key saved.')
      } else {
        const { loginClaudeSubscription } = await import('./claude.js')
        await loginClaudeSubscription()
      }
    })

  authClaude
    .command('logout')
    .description('Remove Claude credentials from hcpro config')
    .action(async () => {
      const { readConfig, writeConfig } = await import('../config.js')
      const config = await readConfig()
      const { claude: _removed, ...rest } = config
      await writeConfig({ ...rest, claude: undefined })
      console.log('Claude credentials removed.')
      console.log('Note: to fully sign out of Claude Code itself, run: claude auth logout')
    })

  authClaude
    .command('status')
    .description('Show Claude authentication status')
    .action(async () => {
      const { printAuthStatus } = await import('./status.js')
      await printAuthStatus()
    })
}
