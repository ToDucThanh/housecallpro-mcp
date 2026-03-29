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

describe('saveClaudeApiKey', () => {
  it('writes apikey auth to config', async () => {
    const { saveClaudeApiKey } = await import('../../src/auth/claude.js')
    const { readConfig } = await import('../../src/config.js')
    await saveClaudeApiKey('sk-ant-test')
    const config = await readConfig()
    expect(config.claude).toEqual({ authMethod: 'apikey', apiKey: 'sk-ant-test' })
  })
})

describe('getClaudeEnvVars', () => {
  it('returns ANTHROPIC_API_KEY when apikey auth is configured', async () => {
    const { saveClaudeApiKey, getClaudeEnvVars } = await import('../../src/auth/claude.js')
    await saveClaudeApiKey('sk-ant-test')
    const env = await getClaudeEnvVars()
    expect(env).toEqual({ ANTHROPIC_API_KEY: 'sk-ant-test' })
  })

  it('returns empty object for subscription auth (Claude Code handles it)', async () => {
    const { saveClaudeSubscription, getClaudeEnvVars } = await import('../../src/auth/claude.js')
    await saveClaudeSubscription()
    const env = await getClaudeEnvVars()
    expect(env).toEqual({})
  })

  it('throws when Claude auth is not configured', async () => {
    const { getClaudeEnvVars } = await import('../../src/auth/claude.js')
    await expect(getClaudeEnvVars()).rejects.toThrow('Claude credentials not configured')
  })
})
