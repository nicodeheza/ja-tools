import {
  DbWord,
  getByKanaAndMecabPosQuery,
  getByKanjiAndMecabPosQuery,
  getByKanjiReadingAndMecabPosQuery,
} from './db/queries.dict.js'
import { Word } from './types.dict.js'

interface WordReducerMap {
  id: number
  kana: Set<string>
  kanji: Set<string>
  mecab: Set<string>
  sense: Map<number, { gloss: Map<number, string>; pos: Set<string> }>
}

function mapDbRes(dbRes: DbWord[]): Word[] {
  const map = new Map<number, WordReducerMap>()

  for (const r of dbRes) {
    let word = map.get(r.id)
    if (!word) {
      word = {
        id: r.id,
        kana: new Set(),
        kanji: new Set(),
        mecab: new Set(),
        sense: new Map(),
      }
      map.set(r.id, word)
    }

    word.kana.add(r.kana)
    if (r.kanji != null) word.kanji.add(r.kanji)
    word.mecab.add(r.mecab)

    let s = word.sense.get(r.senseId)
    if (!s) {
      s = { gloss: new Map(), pos: new Set() }
      word.sense.set(r.senseId, s)
    }
    s.gloss.set(r.glossNumber, r.gloss)
    s.pos.add(r.pos)
  }

  return Array.from(map.values()).map((d) => ({
    id: String(d.id),
    kana: Array.from(d.kana),
    kanji: Array.from(d.kanji),
    mecabPos: Array.from(d.mecab),
    sense: Array.from(d.sense.values()).map((s) => ({
      gloss: Array.from(s.gloss.values()),
      pos: Array.from(s.pos),
    })),
  }))
}

export async function getByKanjiAndMecabPos(
  kanji: string,
  mecabPos: string,
  reading?: string
): Promise<Word[]> {
  let queryRes = reading
    ? await getByKanjiReadingAndMecabPosQuery(kanji, reading, mecabPos)
    : await getByKanjiAndMecabPosQuery(kanji, mecabPos)
  if (reading && queryRes.length === 0) {
    queryRes = await getByKanjiAndMecabPosQuery(kanji, mecabPos)
  }
  return mapDbRes(queryRes)
}

export async function getByKanaAndMecabPos(kana: string, mecabPos: string): Promise<Word[]> {
  const queryRes = await getByKanaAndMecabPosQuery(kana, mecabPos)
  return mapDbRes(queryRes)
}
