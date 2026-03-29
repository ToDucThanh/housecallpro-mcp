import { readConfig, writeConfig } from '../config.js'
import type { HcpOAuthAuth } from '../config.types.js'

export async function saveHcpApiKey(apiKey: string): Promise<void> {
  await writeConfig({ hcp: { authMethod: 'apikey', apiKey } })
}

export async function saveHcpOAuth(oauth: Omit<HcpOAuthAuth, 'authMethod'>): Promise<void> {
  await writeConfig({ hcp: { authMethod: 'oauth', ...oauth } })
}

export async function getHcpEnvVars(): Promise<Record<string, string>> {
  const config = await readConfig()
  const hcp = config.hcp
  if (!hcp) throw new Error('HCP credentials not configured. Run: hcpro auth login')

  if (hcp.authMethod === 'apikey') {
    return {
      HOUSECALL_AUTH_METHOD: 'apikey',
      HOUSECALL_API_KEY: hcp.apiKey,
    }
  }

  // OAuth: check token expiry and refresh if needed
  const refreshed = await refreshIfExpired(hcp)
  return {
    HOUSECALL_AUTH_METHOD: 'oauth',
    HOUSECALL_OAUTH_TOKEN: refreshed.accessToken,
  }
}

async function refreshIfExpired(hcp: HcpOAuthAuth): Promise<HcpOAuthAuth> {
  const expiresAt = new Date(hcp.expiresAt).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (expiresAt - now > fiveMinutes) return hcp   // still valid

  const response = await fetch('https://api.housecallpro.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: hcp.refreshToken,
      client_id: hcp.clientId,
      client_secret: hcp.clientSecret,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token refresh failed (${response.status}): ${text}`)
  }

  const data = await response.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const refreshed: HcpOAuthAuth = {
    ...hcp,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  }

  await writeConfig({ hcp: refreshed })
  return refreshed
}

export function buildHcpAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
  })
  return `https://api.housecallpro.com/oauth/authorize?${params}`
}

export async function loginHcpOAuth(): Promise<void> {
  const { input, password } = await import('@inquirer/prompts')
  const { default: open } = await import('open')

  const clientId = await input({ message: 'HCP OAuth Client ID:' })
  const clientSecret = await password({ message: 'HCP OAuth Client Secret:' })

  const REDIRECT_URI = 'http://localhost:7891/callback'
  const authUrl = buildHcpAuthUrl(clientId, REDIRECT_URI)

  console.log('\nOpening browser for authorization...')
  await open(authUrl)

  // Local callback server
  const code = await new Promise<string>((resolve, reject) => {
    const server = Bun.serve({
      port: 7891,
      fetch(req) {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          server.stop()
          reject(new Error(`OAuth error: ${error}`))
          return new Response('Authorization failed. You can close this tab.', { status: 400 })
        }

        if (code) {
          server.stop()
          resolve(code)
          return new Response('Authorization successful! You can close this tab.', { status: 200 })
        }

        return new Response('Waiting...', { status: 200 })
      },
    })

    // 5 minute timeout
    setTimeout(() => {
      server.stop()
      reject(new Error('OAuth callback timed out after 5 minutes'))
    }, 5 * 60 * 1000)
  })

  // Exchange code for tokens
  const response = await fetch('https://api.housecallpro.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Token exchange failed (${response.status}): ${text}`)
  }

  const data = await response.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  await saveHcpOAuth({
    clientId,
    clientSecret,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  })

  console.log('HCP OAuth login successful.')
}
