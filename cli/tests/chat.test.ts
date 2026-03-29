import { describe, it, expect } from 'bun:test'

describe('buildChatArgs', () => {
  it('includes --mcp-config and --append-system-prompt but NOT -p', async () => {
    const { buildChatArgs } = await import('../src/chat.js')
    const args = buildChatArgs('/tmp/mcp.json', 'skill content here')
    expect(args).toContain('--mcp-config')
    expect(args).toContain('/tmp/mcp.json')
    expect(args).toContain('--append-system-prompt')
    expect(args).toContain('skill content here')
    expect(args).not.toContain('-p')
  })
})
