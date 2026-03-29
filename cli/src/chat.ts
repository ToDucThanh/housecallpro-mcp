import { getHcpEnvVars } from './auth/hcp.js'
import { getClaudeEnvVars } from './auth/claude.js'
import { writeTempMcpConfig } from './mcp-config.js'
import { SKILL_CONTENT } from './skill.js'
import { unlinkSync } from 'fs'

export function buildChatArgs(
  mcpConfigPath: string,
  skillContent: string
): string[] {
  return [
    '--mcp-config', mcpConfigPath,
    '--append-system-prompt', skillContent,
  ]
}

export async function runChat(): Promise<void> {
  const hcpEnv = await getHcpEnvVars()
  const claudeEnv = await getClaudeEnvVars()

  // Detect compiled binary vs bun dev mode
  const scriptArg = process.argv[1]
  const isDevMode = Boolean(scriptArg?.match(/\.(ts|mts|js|mjs)$/))
  const command = process.execPath
  const commandArgs = isDevMode && scriptArg ? [scriptArg] : []

  let mcpConfigPath: string | null = null

  const cleanup = () => {
    if (mcpConfigPath) {
      try { unlinkSync(mcpConfigPath) } catch {}
      mcpConfigPath = null
    }
  }

  const onSIGINT = () => { cleanup(); process.exit(130) }
  const onSIGTERM = () => { cleanup(); process.exit(143) }
  process.once('SIGINT', onSIGINT)
  process.once('SIGTERM', onSIGTERM)

  if (!Bun.which('claude')) {
    throw new Error('claude binary not found. Install Claude Code: https://claude.ai/code')
  }

  try {
    mcpConfigPath = await writeTempMcpConfig(command, commandArgs, hcpEnv)
    const args = buildChatArgs(mcpConfigPath, SKILL_CONTENT)
    const proc = Bun.spawn(['claude', ...args], {
      env: { ...process.env, ...claudeEnv },
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    })
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      process.exit(exitCode)
    }
  } finally {
    process.off('SIGINT', onSIGINT)
    process.off('SIGTERM', onSIGTERM)
    cleanup()
  }
}
