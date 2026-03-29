import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { join } from 'path'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'hcpro-test-'))
  process.env.HCPRO_CONFIG_DIR = tmpDir
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true })
  delete process.env.HCPRO_CONFIG_DIR
})

describe('saveHcpApiKey', () => {
  it('writes apikey auth to config', async () => {
    const { saveHcpApiKey } = await import('../../src/auth/hcp.js')
    const { readConfig } = await import('../../src/config.js')
    await saveHcpApiKey('sk-test-123')
    const config = await readConfig()
    expect(config.hcp).toEqual({ authMethod: 'apikey', apiKey: 'sk-test-123' })
  })
})

describe('getHcpEnvVars', () => {
  it('returns API key env vars for apikey auth', async () => {
    const { saveHcpApiKey, getHcpEnvVars } = await import('../../src/auth/hcp.js')
    await saveHcpApiKey('sk-test-123')
    const env = await getHcpEnvVars()
    expect(env).toEqual({
      HOUSECALL_AUTH_METHOD: 'apikey',
      HOUSECALL_API_KEY: 'sk-test-123',
    })
  })

  it('throws when no HCP auth is configured', async () => {
    const { getHcpEnvVars } = await import('../../src/auth/hcp.js')
    await expect(getHcpEnvVars()).rejects.toThrow('HCP credentials not configured')
  })
})

describe('buildHcpAuthUrl', () => {
  it('builds authorization URL with correct params', async () => {
    const { buildHcpAuthUrl } = await import('../../src/auth/hcp.js')
    const url = buildHcpAuthUrl('client-123', 'http://localhost:7891/callback')
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe('https://api.housecallpro.com/oauth/authorize')
    expect(parsed.searchParams.get('client_id')).toBe('client-123')
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:7891/callback')
    expect(parsed.searchParams.get('response_type')).toBe('code')
  })
})
