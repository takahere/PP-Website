import { NextRequest } from 'next/server'
import { runAnalyticsAgent } from '@/lib/agents/analytics-agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AgentRequest {
  prompt: string
  sessionId?: string
  mode?: 'chat' | 'analysis'
}

export async function POST(req: NextRequest) {
  try {
    const body: AgentRequest = await req.json()
    const { prompt, sessionId, mode = 'chat' } = body

    if (!prompt) {
      return Response.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check for Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Create a streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runAnalyticsAgent(prompt, { sessionId })) {
            // Format as Server-Sent Events
            const data = JSON.stringify(event)
            controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`))
          }
          controller.close()
        } catch (error) {
          const errorEvent = {
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Unknown error' },
          }
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return Response.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Non-streaming version for simple queries
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const prompt = searchParams.get('prompt')
  const sessionId = searchParams.get('sessionId') || undefined

  if (!prompt) {
    return Response.json(
      { error: 'Prompt query parameter is required' },
      { status: 400 }
    )
  }

  // Check for Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'Anthropic API key not configured' },
      { status: 500 }
    )
  }

  try {
    // Collect all events
    const events = []
    for await (const event of runAnalyticsAgent(prompt, { sessionId })) {
      events.push(event)
    }

    return Response.json({ events })
  } catch (error) {
    console.error('Agent API error:', error)
    return Response.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
