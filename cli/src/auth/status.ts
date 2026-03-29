import { readConfig } from '../config.js'

export async function printAuthStatus(): Promise<void> {
  const config = await readConfig()

  const hcp = config.hcp
  if (!hcp) {
    console.log('HouseCall Pro:  not configured  (run: hcpro auth login)')
  } else if (hcp.authMethod === 'apikey') {
    const masked = hcp.apiKey.slice(0, 6) + '...' + hcp.apiKey.slice(-4)
    console.log(`HouseCall Pro:  API key  (${masked})`)
  } else {
    const expiresAt = new Date(hcp.expiresAt)
    const expired = expiresAt < new Date()
    const status = expired ? 'EXPIRED' : `expires ${expiresAt.toLocaleDateString()}`
    console.log(`HouseCall Pro:  OAuth  client_id=${hcp.clientId}  token ${status}`)
  }

  const claude = config.claude
  if (!claude) {
    console.log('Claude:         not configured  (run: hcpro auth claude login)')
  } else if (claude.authMethod === 'apikey') {
    const masked = claude.apiKey.slice(0, 10) + '...'
    console.log(`Claude:         API key  (${masked})`)
  } else {
    console.log('Claude:         subscription (managed by Claude Code)')
  }
}
