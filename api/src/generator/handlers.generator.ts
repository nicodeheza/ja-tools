import { Request, Response } from 'express'
import { generateAnalizadStoryStream } from './service.generator.js'
import { getSseMessage } from '../utils/utils.js'
import { isValidJLPTLevel } from './validations.generator.js'
import { AiKeyLocals } from '../middleware/decrypt-ai-key.middleware.js'
import { logger } from '../utils/logger.js'
import { describeAiError } from '../infrastructure/Ai/index.ai.js'

export async function generateStoryHandler(req: Request, res: Response<unknown, AiKeyLocals>) {
  const { p: prompt, l: level } = req.query as Record<string, string>

  if (!isValidJLPTLevel(level)) {
    res.status(400).json({ message: 'Invalid level' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const storyRes = generateAnalizadStoryStream(prompt, level, res.locals.aiKey)

    for await (const chunk of storyRes) {
      res.write(getSseMessage(JSON.stringify(chunk)))
    }

    res.end(getSseMessage(JSON.stringify({ message: 'done' })))
  } catch (error) {
    logger.error(error, 'Error generating story')
    res.end(getSseMessage(JSON.stringify({ message: 'error', error: describeAiError(error) })))
  }
}
