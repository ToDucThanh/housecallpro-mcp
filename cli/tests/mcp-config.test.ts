import { describe, it, expect } from 'bun:test'
import { readFile, unlink } from 'fs/promises'

describe('buildMcpConfig', () => {
  it('produces valid MCP config JSON pointing to hcpro --mcp-server', async () => {
    const { buildMcpConfig } = await import('../src/mcp-config.js')
    const env = { HOUSECALL_AUTH_METHOD: 'apikey', HOUSECALL_API_KEY: 'key-123' }
    const config = buildMcpConfig('/usr/local/bin/hcpro', [], env)

    expect(config.mcpServers['housecallpro-mcp'].command).toBe('/usr/local/bin/hcpro')
    expect(config.mcpServers['housecallpro-mcp'].args).toEqual(['--mcp-server'])
    expect(config.mcpServers['housecallpro-mcp'].env).toEqual(env)
  })

  it('prepends commandArgs before --mcp-server in dev mode', async () => {
    const { buildMcpConfig } = await import('../src/mcp-config.js')
    const env = { HOUSECALL_AUTH_METHOD: 'apikey', HOUSECALL_API_KEY: 'key-123' }
    const config = buildMcpConfig('/usr/bin/bun', ['/path/to/src/index.ts'], env)

    expect(config.mcpServers['housecallpro-mcp'].command).toBe('/usr/bin/bun')
    expect(config.mcpServers['housecallpro-mcp'].args).toEqual(['/path/to/src/index.ts', '--mcp-server'])
  })
})

describe('writeTempMcpConfig', () => {
  it('writes config to a temp file and returns the path', async () => {
    const { writeTempMcpConfig } = await import('../src/mcp-config.js')
    const env = { HOUSECALL_AUTH_METHOD: 'apikey', HOUSECALL_API_KEY: 'key-123' }

    const tmpPath = await writeTempMcpConfig('/usr/local/bin/hcpro', [], env)
    const raw = await readFile(tmpPath, 'utf-8')
    const parsed = JSON.parse(raw)

    expect(parsed.mcpServers['housecallpro-mcp'].command).toBe('/usr/local/bin/hcpro')
    await unlink(tmpPath)
  })
})
