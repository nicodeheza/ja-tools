import type {Dict, Token} from '../../../types/analyzedText.types'

export interface AnalyzeData {
	text: string
	tokens: Token[]
	dict: Dict
}
