// Analytics Agent Types

export interface Hypothesis {
  originalRequest: string
  interpretedIntent: string
  relevantDataSources: string[]
  confidence: number
  needsClarification: boolean
}

export interface ClarifyingQuestion {
  id: string
  question: string
  options: {
    label: string
    value: string
  }[]
}

export interface ClarifyingAnswer {
  questionId: string
  question: string
  answer: string
  value: string
}

export interface AgentMessage {
  id: string
  type: 'user' | 'assistant' | 'hypothesis' | 'clarify' | 'data' | 'error'
  content: string
  timestamp: Date
  hypothesis?: Hypothesis
  questions?: ClarifyingQuestion[]
  data?: SheetData
}

export interface SheetData {
  columns: string[]
  rows: Record<string, string | number>[]
  chart?: {
    type: 'line' | 'bar' | 'pie' | 'area'
    dataKeys: string[]
    xAxisKey: string
    title?: string
  }
  summary?: string
}

export interface AgentSession {
  id: string
  messages: AgentMessage[]
  currentHypothesis?: Hypothesis
  clarifyingAnswers: ClarifyingAnswer[]
  dataSources: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AgentStreamEvent {
  type: 'hypothesis' | 'clarify' | 'content' | 'data' | 'done' | 'error'
  data: unknown
}

// Data source types
export const DATA_SOURCES = [
  'ga',
  'gsc',
  'realtime',
  'trends',
  'lab-metrics',
  'content-groups',
  'page-performance',
  'user-funnel',
  'user-segments',
  'engagement',
  'cohorts',
  'acquisition',
  'campaigns',
  'lab-attribution',
  'web-vitals',
  'tech-environment',
  'technical-issues',
  'site-search',
  'landing-pages',
  'exit-pages',
  'events',
  'form-analysis',
] as const

export type DataSource = (typeof DATA_SOURCES)[number]

// Agent configuration
export interface AgentConfig {
  model?: string
  maxTurns?: number
  systemPrompt?: string
  mcpServerPath?: string
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTurns: 10,
  mcpServerPath: './mcp-server/dist/index.js',
}
