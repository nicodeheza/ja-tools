import { GenerateContentParameters, GoogleGenAI, type Models } from '@google/genai'

interface RespondArgs {
  prompt: string
  temperature?: number
  model?: string
  systemInstructions?: string
}

const DEFAULT_MODEL = 'gemini-3.5-flash'

class Ai {
  private models: Models

  constructor(apiKey: string) {
    const client = new GoogleGenAI({ apiKey })
    this.models = client.models
  }

  private getParameters(args: RespondArgs): GenerateContentParameters {
    return {
      model: args.model ?? DEFAULT_MODEL,
      contents: args.prompt,
      config: {
        temperature: args.temperature,
        systemInstruction: args.systemInstructions,
      },
    }
  }

  async directRespond(args: RespondArgs): Promise<string> {
    const res = await this.models.generateContent(this.getParameters(args))
    return res.text || ''
  }

  async *streamingResponse(args: RespondArgs): AsyncGenerator<string> {
    const res = await this.models.generateContentStream(this.getParameters(args))

    for await (const chunk of res) {
      yield chunk.text || ''
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.models.list()
      return true
    } catch (error: unknown) {
      if (isRateLimitError(error)) return true
      return false
    }
  }
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  // @google/genai surfaces the HTTP status on the error object
  if ('status' in error && error.status === 429) return true
  if ('message' in error && typeof error.message === 'string' && error.message.includes('429'))
    return true
  return false
}

export function describeAiError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { status?: number; message?: string }
    if (e.status === 429) {
      return 'Rate limit reached — wait a moment and try again'
    }
    const status = e.status ? ` (${e.status})` : ''
    const message = typeof e.message === 'string' ? e.message : JSON.stringify(error)
    return `${status} ${message}`.trim().slice(0, 500)
  }
  return String(error)
}

export function aiDirectResponse(args: RespondArgs, apiKey: string) {
  return new Ai(apiKey).directRespond(args)
}

export async function* aiStreamResponse(args: RespondArgs, apiKey: string): AsyncGenerator<string> {
  const res = new Ai(apiKey).streamingResponse(args)

  for await (const chunk of res) {
    yield chunk
  }
}

export function validateApiKey(apiKey: string): Promise<boolean> {
  const ai = new Ai(apiKey)
  return ai.validateApiKey()
}
