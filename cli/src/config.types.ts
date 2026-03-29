export interface HcpApiKeyAuth {
  authMethod: 'apikey'
  apiKey: string
}

export interface HcpOAuthAuth {
  authMethod: 'oauth'
  clientId: string
  clientSecret: string
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export type HcpAuth = HcpApiKeyAuth | HcpOAuthAuth

export interface ClaudeApiKeyAuth {
  authMethod: 'apikey'
  apiKey: string
}

export interface ClaudeSubscriptionAuth {
  authMethod: 'subscription'
}

export type ClaudeAuth = ClaudeApiKeyAuth | ClaudeSubscriptionAuth

export interface Config {
  hcp?: HcpAuth
  claude?: ClaudeAuth
}
