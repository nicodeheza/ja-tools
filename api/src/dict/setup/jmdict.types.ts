export interface JmdictKanji {
  text: string
  common: boolean
  nf: number | null
}

export interface JmdictKana {
  text: string
  common: boolean
  nf: number | null
  appliesToKanji: string[]
}

export interface JmdictGloss {
  text: string
}

export interface JmdictSense {
  partOfSpeech: string[]
  appliesToKanji: string[]
  appliesToKana: string[]
  gloss: JmdictGloss[]
}

export interface JmdictWord {
  id: string
  kanji: JmdictKanji[]
  kana: JmdictKana[]
  sense: JmdictSense[]
}
