export type Token = WordToken | NoWordToken

export interface WordToken {
	original: string
	isWord: true
	basicForm: string
	furigana?: string
	dictIds: string[]
}

export interface NoWordToken {
	original: string
	isWord: false
}

export type Dict = {[id: string]: Word}

export interface Word {
	kana: string[]
	kanji: string[]
	sense: Sense[]
}

interface Sense {
	pos: string[]
	gloss: string[]
}
