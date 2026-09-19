import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Database } from 'better-sqlite3'
import { pushSQLiteSchema } from 'drizzle-kit/api'
import { sql } from 'drizzle-orm'
import { DictDb } from './db.dict.js'
import { getByKanaAndMecabPos, getByKanjiAndMecabPos } from '../index.dict.js'
import * as dictSchema from './schema.dict.js'

function seed(client: Database) {
  client.exec(
    `
      INSERT INTO words (id) VALUES (1),(2),(3);
      INSERT INTO kanjis (id, common, text, word_id) VALUES (1,1,'彼の',2),(2,1,'本',3);
      INSERT INTO kanas (id, common, text, word_id) VALUES (1,1,'いい',1),(2,1,'あの',2),(3,1,'ほん',3);
      INSERT INTO sense (id, word_id) VALUES (1,1),(2,2),(3,3);
      INSERT INTO glosses (id, text, sense_id) VALUES (1,'good',1),(2,'that',2),(3,'book',3);
      INSERT INTO tags (id, abbreviation, text) VALUES (1,'adj-ix','adjective'),(2,'adj-pn','pre-noun adjectival'),(3,'n','noun');
      INSERT INTO mecab_pos (id, text) VALUES (1,'形容詞'),(2,'連体詞'),(3,'名詞');
      INSERT INTO sense_pos (sense_id, tag_id) VALUES (1,1),(2,2),(3,3);
      INSERT INTO sense_mecab_pos (mecab_pos_id, sense_id) VALUES (1,1),(2,2),(3,3);
      `
  )
}

async function setupInMemoryDb() {
  DictDb.open(false, ':memory:')
  const drizzleDb = DictDb.getDb()
  const push = await pushSQLiteSchema(dictSchema, drizzleDb as never)
  for (const stmt of push.statementsToExecute) {
    drizzleDb.run(sql.raw(stmt))
  }
  seed(drizzleDb.$client)
}

describe('dictionary queries', () => {
  beforeEach(async () => {
    await setupInMemoryDb()
  })

  afterEach(() => {
    DictDb.close()
  })

  it('control: kana+kanji word is findable via its kana', async () => {
    const res = await getByKanaAndMecabPos('あの', '連体詞')
    expect(res).toHaveLength(1)
    expect(res[0].kana).toEqual(['あの'])
    expect(res[0].kanji).toEqual(['彼の'])
  })

  it('control: kana+kanji word is findable via its kanji', async () => {
    const res = await getByKanjiAndMecabPos('本', '名詞')
    expect(res).toHaveLength(1)
    expect(res[0].kana).toEqual(['ほん'])
  })

  it('kana-only word (no kanji form) is findable via its kana', async () => {
    const res = await getByKanaAndMecabPos('いい', '形容詞')
    expect(res).toHaveLength(1)
    expect(res[0].kana).toEqual(['いい'])
    expect(res[0].kanji).toEqual([])
  })
})
