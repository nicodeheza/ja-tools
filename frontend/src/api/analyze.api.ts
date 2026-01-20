import {CONFIG} from '../config'
import {post} from './base.api'

export function useGetTextAnalyzeRes(text: string): Promise<AnalyzeRes> {
	return post<AnalyzeRes>(
		`${CONFIG.API_URL}/analyze`,
		{text},
		{default: 'Error getting analyzed text'}
	)
}

interface AnalyzeRes {
	tokens: Token[]
	dict: Dict
}

type Token =
	| {
			original: string
			isWord: true
			basicForm: string
			furigana?: string
			dictIds: string[]
	  }
	| {
			original: string
			isWord: false
	  }

type Dict = {[id: string]: Word}

interface Word {
	kana: string[]
	kanji: string[]
	sense: Sense[]
}
interface Sense {
	pos: string[]
	gloss: string[]
}
