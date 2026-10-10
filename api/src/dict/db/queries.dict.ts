import { and, eq, sql } from 'drizzle-orm'
import { DictDb } from './db.dict.js'
import {
  glosses,
  kanas,
  kanjis,
  mecabPos,
  sense,
  senseToKana,
  senseToKanji,
  senseToMecabPos,
  senseToPos,
  tags,
  words,
} from './schema.dict.js'

const db = () => DictDb.getDb()

export interface DbWord {
  id: number
  kana: string
  kanji: string | null
  senseId: number
  senseNumber: number
  gloss: string
  glossNumber: number
  pos: string
  mecab: string
}

const wordSelect = {
  id: words.id,
  kana: kanas.text,
  kanji: kanjis.text,
  senseId: sense.id,
  senseNumber: sense.senseNumber,
  gloss: glosses.text,
  glossNumber: glosses.glossNumber,
  pos: tags.text,
  mecab: mecabPos.text,
}

export async function getByKanaAndMecabPosQuery(
  kana: string,
  mecabPosText: string
): Promise<DbWord[]> {
  return db()
    .select(wordSelect)
    .from(words)
    .leftJoin(kanjis, eq(kanjis.wordId, words.id))
    .innerJoin(kanas, eq(kanas.wordId, words.id))
    .innerJoin(sense, eq(sense.wordId, words.id))
    .innerJoin(glosses, eq(glosses.senseId, sense.id))
    .innerJoin(senseToPos, eq(sense.id, senseToPos.senseId))
    .innerJoin(tags, eq(tags.id, senseToPos.tagId))
    .innerJoin(senseToMecabPos, eq(sense.id, senseToMecabPos.senseId))
    .innerJoin(mecabPos, eq(mecabPos.id, senseToMecabPos.mecabPosId))
    .where(and(eq(kanas.text, kana), eq(mecabPos.text, mecabPosText)))
    .orderBy(
      sql`${words.frequency} IS NULL`,
      words.frequency,
      sql`${words.common} DESC`,
      sense.senseNumber,
      glosses.glossNumber
    )
}

export async function getByKanjiAndMecabPosQuery(
  kanji: string,
  mecabPosText: string
): Promise<DbWord[]> {
  return db()
    .select(wordSelect)
    .from(words)
    .innerJoin(kanjis, eq(kanjis.wordId, words.id))
    .innerJoin(kanas, eq(kanas.wordId, words.id))
    .innerJoin(sense, eq(sense.wordId, words.id))
    .innerJoin(glosses, eq(glosses.senseId, sense.id))
    .innerJoin(senseToPos, eq(sense.id, senseToPos.senseId))
    .innerJoin(tags, eq(tags.id, senseToPos.tagId))
    .innerJoin(senseToMecabPos, eq(sense.id, senseToMecabPos.senseId))
    .innerJoin(mecabPos, eq(mecabPos.id, senseToMecabPos.mecabPosId))
    .where(and(eq(kanjis.text, kanji), eq(mecabPos.text, mecabPosText)))
    .orderBy(
      sql`${words.frequency} IS NULL`,
      words.frequency,
      sql`${words.common} DESC`,
      sense.senseNumber,
      glosses.glossNumber
    )
}

export async function getByKanjiReadingAndMecabPosQuery(
  kanji: string,
  reading: string,
  mecabPosText: string
): Promise<DbWord[]> {
  return db()
    .select(wordSelect)
    .from(words)
    .innerJoin(kanjis, eq(kanjis.wordId, words.id))
    .innerJoin(kanas, eq(kanas.wordId, words.id))
    .innerJoin(
      senseToKana,
      and(eq(senseToKana.senseId, sense.id), eq(senseToKana.kanaId, kanas.id))
    )
    .innerJoin(
      senseToKanji,
      and(eq(senseToKanji.senseId, sense.id), eq(senseToKanji.kanjiId, kanjis.id))
    )
    .innerJoin(sense, eq(sense.wordId, words.id))
    .innerJoin(glosses, eq(glosses.senseId, sense.id))
    .innerJoin(senseToPos, eq(sense.id, senseToPos.senseId))
    .innerJoin(tags, eq(tags.id, senseToPos.tagId))
    .innerJoin(senseToMecabPos, eq(sense.id, senseToMecabPos.senseId))
    .innerJoin(mecabPos, eq(mecabPos.id, senseToMecabPos.mecabPosId))
    .where(and(eq(kanjis.text, kanji), eq(mecabPos.text, mecabPosText), eq(kanas.text, reading)))
    .orderBy(
      sql`${words.frequency} IS NULL`,
      words.frequency,
      sql`${words.common} DESC`,
      sense.senseNumber,
      glosses.glossNumber
    )
}
