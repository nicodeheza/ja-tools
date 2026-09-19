import { getFurigana, haveKanji, katakaToHiragana } from './utils.analyzer.js'
import { AnalyzeRes, BulkAnalyzeRes, Dict, Token, TokenizerToken } from './types.analyzer.js'
import { tokenizeText } from './infrastructure/tokenizer.analyzer.js'
import { dictLookup } from './infrastructure/dict.analyzer.js'

const noWord = new Set(['記号', 'BOS/EOS'])

// MeCab tags these function words unreliably (e.g. あの as both フィラー filler and
// 連体詞 "that"). Query all their relevant POS and merge the senses so the tooltip
// always shows the correct definitions regardless of how MeCab tags the token.
//
// The merge is done per word with a small parallel lookup (see getDictWords). If this
// list grows significantly, refactor instead to support the multi-POS search at the
// query level (e.g. `mecab_pos.text IN (...)`) so a single query returns the union.
const ambiguousPosWords: Record<string, string[]> = {
  あの: ['連体詞', 'フィラー', '感動詞'],
}

const newlineMarker: TokenizerToken = { surface: '\n', feature: { pos: '記号' } }

async function tokenizeLinesWithBreaks(text: string): Promise<TokenizerToken[]> {
  const lines = text.split(/\r\n|\n|\r/)
  const perLine = await Promise.all(
    lines.map((line) =>
      line === '' ? Promise.resolve([] as TokenizerToken[]) : tokenizeText(line)
    )
  )
  return perLine.flatMap((tokens, i) => (i === 0 ? tokens : [newlineMarker, ...tokens]))
}

export async function analyzeText(text: string): Promise<AnalyzeRes> {
  const result = await tokenizeLinesWithBreaks(text)

  const dictResults = await getDictResult(result)

  let dict: Dict = {}
  const tokens: Token[] = []
  let wordIdx = 0

  for (const mecabToken of result) {
    const pos = getPos(mecabToken)
    const isWord = pos && !noWord.has(pos)

    if (isWord) {
      const { ids, dict: dictRes } = dictResults[wordIdx++]
      dict = { ...dict, ...dictRes }
      tokens.push({
        isWord: true,
        original: mecabToken.surface,
        mecabPos: pos,
        basicForm: mecabToken.feature.basicForm ?? '',
        furigana: mecabToFurigana(mecabToken.surface, mecabToken.feature.reading ?? ''),
        dictIds: ids,
      })
      continue
    }

    tokens.push({ isWord: false, original: mecabToken.surface })
  }

  return { dict, tokens }
}

const emptyResult: AnalyzeRes = { tokens: [], dict: {} }

export async function analyzeBulk(texts: string[]): Promise<BulkAnalyzeRes> {
  const settled = await Promise.allSettled(
    texts.map((text) => (text.trim() !== '' ? analyzeText(text) : Promise.resolve(emptyResult)))
  )
  const items = settled.map((r) => (r.status === 'fulfilled' ? r.value : emptyResult))
  return {
    dict: Object.assign({}, ...items.map((i) => i.dict)),
    result: items.map((i) => i.tokens),
  }
}

function getPos(token: TokenizerToken) {
  if (!token.feature.pos) return
  return token.feature.pos
}

function mecabToFurigana(original: string, katakana: string): string | undefined {
  if (!haveKanji(original)) return
  const reading = katakaToHiragana(katakana)
  return getFurigana(original, reading)
}

async function getDictWords(word: string, pos: string) {
  const poss = ambiguousPosWords[word] ?? [pos]

  const settled = await Promise.all(poss.map((p) => dictLookup(word, p)))
  const res = Array.from(new Map(settled.flat().map((r) => [r.id, r])).values())

  const ids = res.map((r) => r.id)

  const dict = res.reduce((acc, r) => {
    const { id, ...rest } = r
    return {
      ...acc,
      [id]: rest,
    }
  }, {} satisfies Dict)

  return { ids, dict }
}

type WordEntry = { word: string; pos: string }
async function getDictResult(
  mecabTokens: TokenizerToken[]
): Promise<{ ids: string[]; dict: Dict }[]> {
  const wordEntries: WordEntry[] = []

  mecabTokens.forEach((mecabToken) => {
    const pos = getPos(mecabToken)
    if (pos && !noWord.has(pos)) {
      wordEntries.push({
        word: mecabToken.feature.basicForm ?? mecabToken.surface,
        pos,
      })
    }
  })

  const dictResults = await Promise.allSettled(wordEntries.map((e) => getDictWords(e.word, e.pos)))
  return dictResults.map((r) => (r.status === 'fulfilled' ? r.value : { ids: [], dict: {} }))
}
