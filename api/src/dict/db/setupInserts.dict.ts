import {
  JMdictWord,
  JMdictGloss,
  JMdictKanji,
  JMdictKana,
  JMdictSense,
} from '@scriptin/jmdict-simplified-types'
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

async function insertKanjis(
  kanjisData: JMdictKanji[],
  wordId: number
): Promise<Record<string, number>> {
  const kanjiMap: Record<string, number> = {}
  await Promise.all(
    kanjisData.map(async (k) => {
      const res = await db()
        .insert(kanjis)
        .values({
          common: k.common,
          text: k.text,
          wordId,
        })
        .returning({ id: kanjis.id })
      kanjiMap[k.text] = res[0].id
    })
  )

  return kanjiMap
}

async function insertKana(
  kanasData: JMdictKana[],
  wordId: number,
  kanjiMap: Record<string, number>
): Promise<Record<string, number>> {
  const kanaMap: Record<string, number> = {}
  const kanasInsertData = await Promise.all(
    kanasData.map(async (k) => {
      const res = await db()
        .insert(kanas)
        .values({
          common: k.common,
          text: k.text,
          wordId,
        })
        .returning({ id: kanas.id })

      kanaMap[k.text] = res[0].id

      return { id: res[0].id, kanjis: k.appliesToKanji }
    })
  )

  await Promise.all(
    kanasInsertData.map(({ id, kanjis: appliesKanjis }) => {
      if (appliesKanjis.length === 0) return
      if (appliesKanjis[0] === '*') {
        return insertKanaKanji(id, Object.values(kanjiMap))
      }

      return insertKanaKanji(
        id,
        appliesKanjis.map((k) => kanjiMap[k])
      )
    })
  )

  return kanaMap
}
function insertSenseKanji(senseId: number, kanjisIds: number[]) {
  return Promise.all(
    kanjisIds.map((id) => {
      return db().insert(senseToKanji).values({
        senseId,
        kanjiId: id,
      })
    })
  )
}
function insertSenseKana(senseId: number, kanasIds: number[]) {
  return Promise.all(
    kanasIds.map((id) => {
      return db().insert(senseToKana).values({
        senseId,
        kanaId: id,
      })
    })
  )
}
function insertKanaKanji(kanaId: number, kanjisIds: number[]) {
  return Promise.all(
    kanjisIds.map((id) => db().insert(kanasToKanjis).values({ kanaId, kanjisId: id }))
  )
}

interface SenseInsertRes {
  id: number
  kanjis: string[]
  kanas: string[]
  glosses: JMdictGloss[]
  pos: string[]
}

function insertSense(senseData: JMdictSense[], wordId: number): Promise<SenseInsertRes[]> {
  return Promise.all(
    senseData.map(async (s) => {
      const res = await db().insert(sense).values({ wordId }).returning({ id: sense.id })
      return {
        id: res[0].id,
        kanjis: s.appliesToKanji,
        kanas: s.appliesToKana,
        glosses: s.gloss,
        pos: s.partOfSpeech,
      }
    })
  )
}

function insertAllSenseKanji(senseData: SenseInsertRes[], kanjiMap: Record<string, number>) {
  return Promise.all(
    senseData.map(({ id, kanjis: appliesKanjis }) => {
      if (appliesKanjis.length === 0) return
      if (appliesKanjis[0] === '*') return insertSenseKanji(id, Object.values(kanjiMap))
      return insertSenseKanji(
        id,
        appliesKanjis.map((k) => kanjiMap[k])
      )
    })
  )
}

function insertAllSenseKana(senseData: SenseInsertRes[], kanaMap: Record<string, number>) {
  return Promise.all(
    senseData.map(({ id, kanas: appliesKanas }) => {
      if (appliesKanas.length === 0) return
      if (appliesKanas[0] === '*') return insertSenseKana(id, Object.values(kanaMap))
      return insertSenseKana(
        id,
        appliesKanas.map((k) => kanaMap[k])
      )
    })
  )
}

function insertGlosses(senseId: number, senseGlosses: JMdictGloss[]) {
  return Promise.all(
    senseGlosses.map((g) => {
      return db().insert(glosses).values({
        text: g.text,
        senseId,
      })
    })
  )
}

function insertAllGlosses(senseData: SenseInsertRes[]) {
  return Promise.all(
    senseData.map(({ id, glosses: senseGlosses }) => {
      return insertGlosses(id, senseGlosses)
    })
  )
}

function insertSensePos(senseId: number, tagIds: number[]) {
  return Promise.all(
    tagIds.map((id) =>
      db().insert(senseToPos).values({
        senseId,
        tagId: id,
      })
    )
  )
}

function insertAllSensePos(senseData: SenseInsertRes[], tagsMap: Record<string, number>) {
  return Promise.all(
    senseData.map(({ id, pos }) => {
      return insertSensePos(
        id,
        pos.map((p) => tagsMap[p])
      )
    })
  )
}

function insertSenseMecab(senseId: number, mecabIds: number[]) {
  return Promise.all(
    mecabIds.map((id) => {
      return db().insert(senseToMecabPos).values({
        senseId,
        mecabPosId: id,
      })
    })
  )
}

export function getMecabPosFormTags(tags: string[], mecabPosMap: Record<string, number>): number[] {
  const posList = tags.map((p) => jmdictToMecabPOS[p]).flat()
  const noDuplicateList = Array.from(new Set(posList))
  return noDuplicateList.map((p) => mecabPosMap[p])
}

function insertAllSenseMecab(senseData: SenseInsertRes[], mecabPosMap: Record<string, number>) {
  return Promise.all(
    senseData.map(({ id, pos }) => {
      return insertSenseMecab(id, getMecabPosFormTags(pos, mecabPosMap))
    })
  )
}

export async function insertToDict(
  jmdictWord: JMdictWord,
  mecabPosMap: Record<string, number>,
  tagsMap: Record<string, number>
) {
  const [{ id: wordId }] = await db().insert(words).values({}).returning({ id: words.id })

  const kanjiMap = await insertKanjis(jmdictWord.kanji, wordId)

  const kanaMap = await insertKana(jmdictWord.kana, wordId, kanjiMap)

  const senseInsertData = await insertSense(jmdictWord.sense, wordId)

  await insertAllSenseKanji(senseInsertData, kanjiMap)

  await insertAllSenseKana(senseInsertData, kanaMap)

  await insertAllGlosses(senseInsertData)

  await insertAllSensePos(senseInsertData, tagsMap)

  await insertAllSenseMecab(senseInsertData, mecabPosMap)
  console.log(jmdictWord.id, 'inserted')
}
