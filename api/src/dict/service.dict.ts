import { DbWord, getByKanaAndMecabPosQuery, getByKanjiAndMecabPosQuery } from './db/queries.dict.js'
import { Word } from './types.dict.js'

interface WordReducerMap {
  id: number
  kana: Set<string>
  kanji: Set<string>
  mecab: Set<string>
  sense: Record<
    number,
    {
      gloss: Set<string>
      pos: Set<string>
    }
  >
}

function getNewReducerSense(res: DbWord, last?: WordReducerMap['sense']): WordReducerMap['sense'] {
  return {
    ...(last ?? {}),
    [res.senseId]: {
      gloss: new Set<string>().add(res.gloss),
      pos: new Set<string>().add(res.pos),
    },
  }
}

function mapDbRes(dbRes: DbWord[]): Word[] {
  let map: Record<number, WordReducerMap> = {}

  map = dbRes.reduce((acc, r) => {
    if (acc[r.id]) {
      acc[r.id].kana.add(r.kana)
      if (r.kanji != null) acc[r.id].kanji.add(r.kanji)
      acc[r.id].mecab.add(r.mecab)

      if (acc[r.id].sense[r.senseId]) {
        acc[r.id].sense[r.senseId].gloss.add(r.gloss)
        acc[r.id].sense[r.senseId].pos.add(r.pos)
      } else {
        acc[r.id].sense = getNewReducerSense(r, acc[r.id].sense)
      }

      return acc
    }

    return {
      ...acc,
      [r.id]: {
        id: r.id,
        kana: new Set<string>().add(r.kana),
        kanji: r.kanji != null ? new Set<string>().add(r.kanji) : new Set<string>(),
        mecab: new Set<string>().add(r.mecab),
        sense: getNewReducerSense(r),
      },
    }
  }, map)

  return Object.values(map).map((d) => ({
    id: String(d.id),
    kana: Array.from(d.kana),
    kanji: Array.from(d.kanji),
    mecabPos: Array.from(d.mecab),
    sense: Object.values(d.sense).map((s) => ({
      gloss: Array.from(s.gloss),
      pos: Array.from(s.pos),
    })),
  }))
}

export async function getByKanjiAndMecabPos(kanji: string, mecabPos: string): Promise<Word[]> {
  const queryRes = await getByKanjiAndMecabPosQuery(kanji, mecabPos)
  return mapDbRes(queryRes)
}

export async function getByKanaAndMecabPos(kana: string, mecabPos: string): Promise<Word[]> {
  const queryRes = await getByKanaAndMecabPosQuery(kana, mecabPos)
  return mapDbRes(queryRes)
}
