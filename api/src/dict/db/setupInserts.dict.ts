import type { Database } from 'better-sqlite3'
import {
  JmdictGloss,
  JmdictKanji,
  JmdictKana,
  JmdictSense,
  JmdictWord,
} from '../setup/jmdict.types.js'
import { jmdictToMecabPOS } from '../types.dict.js'
import { DictDb } from './db.dict.js'
import {
  mecabPos,
  words,
  kanjis,
  kanas,
  kanasToKanjis,
  sense,
  senseToKanji,
  senseToKana,
  glosses,
  senseToPos,
  senseToMecabPos,
  tags as tagsTable,
} from './schema.dict.js'

function db() {
  return DictDb.getDb()
}

function client(): Database {
  return db().$client
}

function getMecabPosList(): string[] {
  return Array.from(new Set(Object.values(jmdictToMecabPOS).flat()))
}

export async function insertTags(tags: Record<string, string>): Promise<Record<string, number>> {
  const tagsMap: Record<string, number> = {}
  await Promise.all(
    Object.keys(tags).map(async (t) => {
      const res = await db()
        .insert(tagsTable)
        .values({
          abbreviation: t,
          text: tags[t],
        })
        .returning({ id: tagsTable.id })

      tagsMap[t] = res[0].id
    })
  )

  return tagsMap
}

export async function insertMecabPos(): Promise<Record<string, number>> {
  const mecabPosMap: Record<string, number> = {}
  await Promise.all(
    getMecabPosList().map(async (p) => {
      const res = await db()
        .insert(mecabPos)
        .values({
          text: p,
        })
        .returning({ id: mecabPos.id })
      mecabPosMap[p] = res[0].id
    })
  )

  return mecabPosMap
}

function insertKanjis(kanjisData: JmdictKanji[], wordId: number): Record<string, number> {
  const kanjiMap: Record<string, number> = {}
  for (const k of kanjisData) {
    const res = db()
      .insert(kanjis)
      .values({
        common: k.common,
        text: k.text,
        wordId,
      })
      .returning({ id: kanjis.id })
      .all()
    kanjiMap[k.text] = res[0].id
  }

  return kanjiMap
}

function insertKana(
  kanasData: JmdictKana[],
  wordId: number,
  kanjiMap: Record<string, number>
): Record<string, number> {
  const kanaMap: Record<string, number> = {}
  const kanasInsertData = kanasData.map((k) => {
    const res = db()
      .insert(kanas)
      .values({
        common: k.common,
        text: k.text,
        wordId,
      })
      .returning({ id: kanas.id })
      .all()

    kanaMap[k.text] = res[0].id

    return { id: res[0].id, kanjis: k.appliesToKanji }
  })

  for (const { id, kanjis: appliesKanjis } of kanasInsertData) {
    if (appliesKanjis.length === 0) continue
    if (appliesKanjis[0] === '*') {
      insertKanaKanji(id, Object.values(kanjiMap))
      continue
    }
    insertKanaKanji(
      id,
      appliesKanjis.map((k) => kanjiMap[k])
    )
  }

  return kanaMap
}

function insertSenseKanji(senseId: number, kanjisIds: number[]) {
  for (const id of kanjisIds) {
    db().insert(senseToKanji).values({ senseId, kanjiId: id }).run()
  }
}

function insertSenseKana(senseId: number, kanasIds: number[]) {
  for (const id of kanasIds) {
    db().insert(senseToKana).values({ senseId, kanaId: id }).run()
  }
}

function insertKanaKanji(kanaId: number, kanjisIds: number[]) {
  for (const id of kanjisIds) {
    db().insert(kanasToKanjis).values({ kanaId, kanjisId: id }).run()
  }
}

interface SenseInsertRes {
  id: number
  kanjis: string[]
  kanas: string[]
  glosses: JmdictGloss[]
  pos: string[]
}

function insertSense(senseData: JmdictSense[], wordId: number): SenseInsertRes[] {
  return senseData.map((s, i) => {
    const res = db()
      .insert(sense)
      .values({ wordId, senseNumber: i + 1 })
      .returning({ id: sense.id })
      .all()
    return {
      id: res[0].id,
      kanjis: s.appliesToKanji,
      kanas: s.appliesToKana,
      glosses: s.gloss,
      pos: s.partOfSpeech,
    }
  })
}

function insertAllSenseKanji(senseData: SenseInsertRes[], kanjiMap: Record<string, number>) {
  for (const { id, kanjis: appliesKanjis } of senseData) {
    if (appliesKanjis.length === 0) continue
    if (appliesKanjis[0] === '*') {
      insertSenseKanji(id, Object.values(kanjiMap))
      continue
    }
    insertSenseKanji(
      id,
      appliesKanjis.map((k) => kanjiMap[k])
    )
  }
}

function insertAllSenseKana(senseData: SenseInsertRes[], kanaMap: Record<string, number>) {
  for (const { id, kanas: appliesKanas } of senseData) {
    if (appliesKanas.length === 0) continue
    if (appliesKanas[0] === '*') {
      insertSenseKana(id, Object.values(kanaMap))
      continue
    }
    insertSenseKana(
      id,
      appliesKanas.map((k) => kanaMap[k])
    )
  }
}

function insertGlosses(senseId: number, senseGlosses: JmdictGloss[]) {
  senseGlosses.forEach((g, i) => {
    db()
      .insert(glosses)
      .values({
        text: g.text,
        senseId,
        glossNumber: i + 1,
      })
      .run()
  })
}

function insertAllGlosses(senseData: SenseInsertRes[]) {
  for (const { id, glosses: senseGlosses } of senseData) {
    insertGlosses(id, senseGlosses)
  }
}

function insertSensePos(senseId: number, tagIds: number[]) {
  for (const id of tagIds) {
    db().insert(senseToPos).values({ senseId, tagId: id }).run()
  }
}

function insertAllSensePos(senseData: SenseInsertRes[], tagsMap: Record<string, number>) {
  for (const { id, pos } of senseData) {
    insertSensePos(
      id,
      pos.map((p) => tagsMap[p])
    )
  }
}

function insertSenseMecab(senseId: number, mecabIds: number[]) {
  for (const id of mecabIds) {
    db().insert(senseToMecabPos).values({ senseId, mecabPosId: id }).run()
  }
}

export function getMecabPosFormTags(tags: string[], mecabPosMap: Record<string, number>): number[] {
  const posList = tags.map((p) => jmdictToMecabPOS[p]).flat()
  const noDuplicateList = Array.from(new Set(posList))
  return noDuplicateList.map((p) => mecabPosMap[p])
}

function insertAllSenseMecab(senseData: SenseInsertRes[], mecabPosMap: Record<string, number>) {
  for (const { id, pos } of senseData) {
    insertSenseMecab(id, getMecabPosFormTags(pos, mecabPosMap))
  }
}

function wordFrequency(jmdictWord: JmdictWord): number | null {
  const nfs = [...jmdictWord.kanji, ...jmdictWord.kana]
    .map((f) => f.nf)
    .filter((nf): nf is number => nf !== null)
  return nfs.length > 0 ? Math.min(...nfs) : null
}

function wordCommon(jmdictWord: JmdictWord): boolean {
  return [...jmdictWord.kanji, ...jmdictWord.kana].some((f) => f.common)
}

export function insertToDict(
  jmdictWord: JmdictWord,
  mecabPosMap: Record<string, number>,
  tagsMap: Record<string, number>
) {
  client().transaction(() => {
    const [{ id: wordId }] = db()
      .insert(words)
      .values({ common: wordCommon(jmdictWord), frequency: wordFrequency(jmdictWord) })
      .returning({ id: words.id })
      .all()

    const kanjiMap = insertKanjis(jmdictWord.kanji, wordId)

    const kanaMap = insertKana(jmdictWord.kana, wordId, kanjiMap)

    const senseInsertData = insertSense(jmdictWord.sense, wordId)

    insertAllSenseKanji(senseInsertData, kanjiMap)

    insertAllSenseKana(senseInsertData, kanaMap)

    insertAllGlosses(senseInsertData)

    insertAllSensePos(senseInsertData, tagsMap)

    insertAllSenseMecab(senseInsertData, mecabPosMap)
  })()
}
