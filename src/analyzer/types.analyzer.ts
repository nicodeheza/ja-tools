export type Token =
	| {
			original: string
			isWord: true
			basicForm: string
			mecabPos: string
			furigana?: string
			dictIds: string[]
	  }
	| {
			original: string
			isWord: false
	  }

export type Dict = {[id: string]: Omit<Word, 'id'>}

export interface AnalyzeRes {
	tokens: Token[]
	dict: Dict
}

export interface BulkAnalyzeRes {
	dict: Dict
	result: Token[][]
}

interface Word {
	id: string
	kana: string[]
	kanji: string[]
	mecabPos: string[]
	sense: Sense[]
}

interface Sense {
	pos: string[]
	gloss: string[]
}

export type DictWord = Omit<Word, 'mecabPos'>

export interface TokenizerToken {
	feature: {
		basicForm?: string
		reading?: string
		pos?: string
	}
	surface: string
}
