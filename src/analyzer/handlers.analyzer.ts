import {Request, Response} from 'express'
import {analyzeText, analyzeBulk} from './service.analyzer.js'
import {isStringArray} from './validations.analyzer.js'

export async function analyzeTextHandler(req: Request, res: Response) {
	const {text} = req.body as {text?: string}

	// Validate text input
	if (!text || text.trim() === '') {
		res.status(400).json({error: 'Text is required'})
		return
	}

	try {
		const result = await analyzeText(text)
		res.json(result)
	} catch (error) {
		console.error(error)
		res.status(500).json({error: 'Internal server error'})
	}
}

export async function analyzeBulkHandler(req: Request, res: Response) {
	const texts = req.body

	if (!isStringArray(texts)) {
		res.status(400).json({error: 'Body must be an array of strings'})
		return
	}

	try {
		const result = await analyzeBulk(texts)
		res.json(result)
	} catch (error) {
		console.error(error)
		res.status(500).json({error: 'Internal server error'})
	}
}
