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

describe('readConfig', () => {
  it('returns empty config when file does not exist', async () => {
    const { readConfig } = await import('../src/config.js')
    const config = await readConfig()
    expect(config).toEqual({})
  })
})

describe('writeConfig', () => {
  it('persists config and readConfig returns it', async () => {
    const { readConfig, writeConfig } = await import('../src/config.js')
    const data = { hcp: { authMethod: 'apikey' as const, apiKey: 'test-key' } }
    await writeConfig(data)
    const result = await readConfig()
    expect(result).toEqual(data)
  })

  it('merges with existing config', async () => {
    const { readConfig, writeConfig } = await import('../src/config.js')
    await writeConfig({ hcp: { authMethod: 'apikey' as const, apiKey: 'key1' } })
    await writeConfig({ claude: { authMethod: 'subscription' as const } })
    const result = await readConfig()
    expect(result.hcp).toEqual({ authMethod: 'apikey', apiKey: 'key1' })
    expect(result.claude).toEqual({ authMethod: 'subscription' })
  })
})

describe('configPath', () => {
  it('returns path inside HCPRO_CONFIG_DIR when set', async () => {
    const { configPath } = await import('../src/config.js')
    expect(configPath()).toContain(tmpDir)
    expect(configPath()).toEndWith('config.json')
  })
})
