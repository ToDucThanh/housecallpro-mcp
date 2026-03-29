#!/usr/bin/env bun
import { program } from 'commander'
import { version } from '../package.json'

// MCP server mode — invoked by Claude Code, not by humans
if (process.argv.includes('--mcp-server')) {
  let createServer: () => unknown
  try {
    ({ createServer } = await import('../../src/server.js'))
  } catch {
    console.error('error: MCP server not found. Build from the repo root, not the cli/ directory.')
    process.exit(1)
  }
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')
  const server = (createServer as () => { connect: (t: unknown) => Promise<void> })()
  const transport = new StdioServerTransport()
  await server.connect(transport)
} else {
  // CLI mode
  program
    .name('hcpro')
    .description('HouseCall Pro AI assistant for the terminal')
    .version(version)

  program
    .argument('[query...]', 'Natural language query for HouseCall Pro')
    .action(async (queryParts: string[]) => {
      if (queryParts.length === 0) {
        program.help()
        return
      }
      const { runQuery } = await import('./query.js')
      await runQuery(queryParts.join(' '))
    })

  const { registerAuthCommands } = await import('./auth/index.js')
  registerAuthCommands(program)

  program
    .command('chat')
    .description('Start an interactive HouseCall Pro session')
    .action(async () => {
      const { runChat } = await import('./chat.js')
      await runChat()
    })

  await program.parseAsync(process.argv)
}
