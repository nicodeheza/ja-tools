import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { pushSQLiteSchema } from 'drizzle-kit/api'
import { sql } from 'drizzle-orm'
import type { JmdictWord } from '../setup/jmdict.types.js'
import { DictDb } from './db.dict.js'
import { insertMecabPos, insertTags, insertToDict } from './setupInserts.dict.js'
import * as dictSchema from './schema.dict.js'

function makeSense(glossTexts: string[]): JmdictWord['sense'][number] {
  return {
    partOfSpeech: ['n'],
    appliesToKanji: ['*'],
    appliesToKana: ['*'],
    gloss: glossTexts.map((text) => ({ text })),
  }
}

const word: JmdictWord = {
  id: '9999999',
  kanji: [{ text: '試す', common: true, nf: 2 }],
  kana: [{ common: true, text: 'ためす', nf: 1, appliesToKanji: ['試す'] }],
  sense: [makeSense(['test', 'favorite']), makeSense(['exam'])],
}

async function setupInMemoryDb() {
  DictDb.open(false, ':memory:')
  const drizzleDb = DictDb.getDb()
  const push = await pushSQLiteSchema(dictSchema, drizzleDb as never)
  for (const stmt of push.statementsToExecute) {
    drizzleDb.run(sql.raw(stmt))
  }
}

describe('dictionary setup inserts', () => {
  beforeEach(async () => {
    await setupInMemoryDb()
  })

  afterEach(() => {
    DictDb.close()
  })

  it('stores sense_number as the sense array index + 1', async () => {
    const tags = await insertTags({ n: 'noun' })
    const mecab = await insertMecabPos()
    await insertToDict(word, mecab, tags)

    const client = DictDb.getDb().$client
    const rows = client
      .prepare(
        `SELECT s.sense_number AS sense_number, g.text AS text
         FROM sense s
         JOIN glosses g ON g.sense_id = s.id AND g.gloss_number = 1
         ORDER BY g.text`
      )
      .all() as Array<{ sense_number: number; text: string }>

    expect(rows).toEqual([
      { sense_number: 2, text: 'exam' },
      { sense_number: 1, text: 'test' },
    ])
  })

  it('stores gloss_number as the gloss array index + 1', async () => {
    const tags = await insertTags({ n: 'noun' })
    const mecab = await insertMecabPos()
    await insertToDict(word, mecab, tags)

    const client = DictDb.getDb().$client
    const rows = client
      .prepare(
        'SELECT g.text AS text, g.gloss_number AS gloss_number FROM glosses g ORDER BY g.text'
      )
      .all() as Array<{ gloss_number: number; text: string }>

    expect(rows).toEqual([
      { gloss_number: 1, text: 'exam' },
      { gloss_number: 2, text: 'favorite' },
      { gloss_number: 1, text: 'test' },
    ])
  })

  it('stores the word frequency as the min nf across its forms', async () => {
    const tags = await insertTags({ n: 'noun' })
    const mecab = await insertMecabPos()
    await insertToDict(word, mecab, tags)

    const client = DictDb.getDb().$client
    const rows = client.prepare(`SELECT frequency FROM words`).all() as Array<{
      frequency: number | null
    }>
    expect(rows).toEqual([{ frequency: 1 }])
  })

  it('stores the word common flag from any common form', async () => {
    const tags = await insertTags({ n: 'noun' })
    const mecab = await insertMecabPos()
    await insertToDict(word, mecab, tags)

    const client = DictDb.getDb().$client
    const rows = client.prepare(`SELECT common FROM words`).all() as Array<{ common: number }>
    expect(rows).toEqual([{ common: 1 }])
  })
})
