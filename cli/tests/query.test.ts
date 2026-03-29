import { describe, it, expect } from 'bun:test'

describe('buildClaudeArgs', () => {
  it('includes --mcp-config, --append-system-prompt, --dangerously-skip-permissions, and -p flags', async () => {
    const { buildClaudeArgs } = await import('../src/query.js')
    const args = buildClaudeArgs('/tmp/mcp.json', 'show customers', 'skill content here')
    expect(args).toContain('--mcp-config')
    expect(args).toContain('/tmp/mcp.json')
    expect(args).toContain('--append-system-prompt')
    expect(args).toContain('skill content here')
    expect(args).toContain('--dangerously-skip-permissions')
    expect(args).toContain('-p')
    expect(args).toContain('show customers')
  })
})
