import type {Dict, Token} from '../../../types/analyzedText.types'

interface Box {
	x: number
	y: number
	w: number
	h: number
}

export interface OcrResult {
	text: string
	box: Box
}

export interface AnalyzedOcrResult {
	data: {
		tokens: Token[]
		box: Box
	}[]
	dict: Dict
}
