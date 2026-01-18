import { query } from '@anthropic-ai/claude-agent-sdk'
import type { Options as ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk'
import type {
  AgentConfig,
  AgentStreamEvent,
  Hypothesis,
  ClarifyingQuestion,
  SheetData,
} from './types'
import { DEFAULT_AGENT_CONFIG } from './types'

// System prompt for the analytics agent
const ANALYTICS_SYSTEM_PROMPT = `あなたはPartnerPropウェブサイトのアナリティクス専門AIアシスタントです。

## あなたの役割
ユーザーが欲しいデータを正確に特定するために、仮説を立てて質問を行います。
人は自分が欲しいデータを明確に表現できないことが多いため、あなたが仮説を立てて確認することで、本当に必要な情報を引き出します。

## ワークフロー
1. ユーザーのリクエストを受け取ったら、まず generate_hypothesis ツールを使って仮説を立てる
2. 信頼度が80%未満の場合は、ask_clarifying_questions ツールで質問を生成する
3. 十分な情報が集まったら、fetch_analytics_data ツールでデータを取得する
4. データを分析して、わかりやすく説明する

## 応答ガイドライン
- すべての応答は日本語で行う
- 具体的な数値を含める
- 仮説を立てたことをユーザーに伝え、確認を求める
- 次のアクションや追加分析を提案する`

// Configuration for MCP server
function getMcpServerConfig(config: AgentConfig): Record<string, { command: string; args: string[] }> {
  const serverPath = config.mcpServerPath || './mcp-server/dist/index.js'
  return {
    analytics: {
      command: 'node',
      args: [serverPath],
    },
  }
}

// Run the analytics agent with streaming
export async function* runAnalyticsAgent(
  prompt: string,
  options?: {
    sessionId?: string
    config?: AgentConfig
    onHypothesis?: (hypothesis: Hypothesis) => void
    onClarify?: (questions: ClarifyingQuestion[]) => void
    onData?: (data: SheetData) => void
  }
): AsyncGenerator<AgentStreamEvent, void, unknown> {
  const config = { ...DEFAULT_AGENT_CONFIG, ...options?.config }

  const agentOptions: ClaudeAgentOptions = {
    systemPrompt: config.systemPrompt || ANALYTICS_SYSTEM_PROMPT,
    mcpServers: getMcpServerConfig(config),
    maxTurns: config.maxTurns,
  }

  // Resume session if provided
  if (options?.sessionId) {
    agentOptions.resume = options.sessionId
  }

  try {
    for await (const message of query({
      prompt,
      options: agentOptions,
    })) {
      // Parse and emit different event types based on message content
      if ('type' in message) {
        switch (message.type) {
          case 'system':
            if ('subtype' in message && message.subtype === 'init') {
              // Session initialized
              yield {
                type: 'done',
                data: { sessionId: (message as { session_id?: string }).session_id },
              }
            }
            break

          case 'assistant':
            // Check if this is a tool result
            if ('tool_use' in message) {
              const toolUse = message.tool_use as { name: string; result?: string }

              if (toolUse.name === 'generate_hypothesis' && toolUse.result) {
                try {
                  const hypothesis = JSON.parse(toolUse.result) as Hypothesis
                  options?.onHypothesis?.(hypothesis)
                  yield { type: 'hypothesis', data: hypothesis }
                } catch {
                  // Not valid JSON, skip
                }
              } else if (toolUse.name === 'ask_clarifying_questions' && toolUse.result) {
                try {
                  const result = JSON.parse(toolUse.result)
                  const questions = result.questions as ClarifyingQuestion[]
                  options?.onClarify?.(questions)
                  yield { type: 'clarify', data: questions }
                } catch {
                  // Not valid JSON, skip
                }
              } else if (toolUse.name === 'generate_sheet_data' && toolUse.result) {
                try {
                  const data = JSON.parse(toolUse.result) as SheetData
                  options?.onData?.(data)
                  yield { type: 'data', data }
                } catch {
                  // Not valid JSON, skip
                }
              }
            }

            // Regular text content
            if ('content' in message && typeof message.content === 'string') {
              yield { type: 'content', data: message.content }
            }
            break

          case 'result':
            if ('result' in message) {
              yield { type: 'content', data: (message as { result: string }).result }
            }
            break
        }
      }
    }

    yield { type: 'done', data: {} }
  } catch (error) {
    yield {
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'Unknown error' },
    }
  }
}

// Simple query function for non-streaming use
export async function queryAnalyticsAgent(
  prompt: string,
  options?: {
    sessionId?: string
    config?: AgentConfig
  }
): Promise<{
  response: string
  hypothesis?: Hypothesis
  questions?: ClarifyingQuestion[]
  data?: SheetData
  sessionId?: string
}> {
  let response = ''
  let hypothesis: Hypothesis | undefined
  let questions: ClarifyingQuestion[] | undefined
  let data: SheetData | undefined
  let sessionId: string | undefined

  for await (const event of runAnalyticsAgent(prompt, {
    ...options,
    onHypothesis: (h) => {
      hypothesis = h
    },
    onClarify: (q) => {
      questions = q
    },
    onData: (d) => {
      data = d
    },
  })) {
    switch (event.type) {
      case 'content':
        response += event.data as string
        break
      case 'done':
        if (event.data && typeof event.data === 'object' && 'sessionId' in event.data) {
          sessionId = event.data.sessionId as string
        }
        break
    }
  }

  return { response, hypothesis, questions, data, sessionId }
}
