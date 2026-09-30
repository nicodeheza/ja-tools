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

      -- word 4: 道 / みち (two senses, both apply to みち)
      INSERT INTO words (id) VALUES (4);
      INSERT INTO kanjis (id, common, text, word_id) VALUES (4,1,'道',4);
      INSERT INTO kanas (id, common, text, word_id) VALUES (4,1,'みち',4);
      INSERT INTO sense (id, word_id) VALUES (4,4),(5,4);
      INSERT INTO glosses (id, text, sense_id) VALUES (4,'road',4),(5,'method',5);
      INSERT INTO sense_kana (sense_id, kana_id) VALUES (4,4),(5,4);
      INSERT INTO sense_kanji (sense_id, kanji_id) VALUES (4,4),(5,4);
      INSERT INTO sense_pos (sense_id, tag_id) VALUES (4,3),(5,3);
      INSERT INTO sense_mecab_pos (mecab_pos_id, sense_id) VALUES (3,4),(3,5);

      -- word 5: 道 / どう (separate entry, same kanji)
      INSERT INTO words (id) VALUES (5);
      INSERT INTO kanjis (id, common, text, word_id) VALUES (5,1,'道',5);
      INSERT INTO kanas (id, common, text, word_id) VALUES (5,1,'どう',5);
      INSERT INTO sense (id, word_id) VALUES (6,5);
      INSERT INTO glosses (id, text, sense_id) VALUES (6,'way',6);
      INSERT INTO sense_kana (sense_id, kana_id) VALUES (6,5);
      INSERT INTO sense_kanji (sense_id, kanji_id) VALUES (6,5);
      INSERT INTO sense_pos (sense_id, tag_id) VALUES (6,3);
      INSERT INTO sense_mecab_pos (mecab_pos_id, sense_id) VALUES (3,6);

      -- word 6: 明日 / あした・あす (sense 8 applies only to あす)
      INSERT INTO words (id) VALUES (6);
      INSERT INTO kanjis (id, common, text, word_id) VALUES (6,1,'明日',6);
      INSERT INTO kanas (id, common, text, word_id) VALUES (6,1,'あした',6),(7,1,'あす',6);
      INSERT INTO sense (id, word_id) VALUES (7,6),(8,6);
      INSERT INTO glosses (id, text, sense_id) VALUES (7,'tomorrow',7),(8,'near future',8);
      INSERT INTO sense_kana (sense_id, kana_id) VALUES (7,6),(7,7),(8,7);
      INSERT INTO sense_kanji (sense_id, kanji_id) VALUES (7,6),(8,6);
      INSERT INTO sense_pos (sense_id, tag_id) VALUES (7,3),(8,3);
      INSERT INTO sense_mecab_pos (mecab_pos_id, sense_id) VALUES (3,7),(3,8);
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

  it('kanji lookup filters out other readings of the same kanji', async () => {
    const res = await getByKanjiAndMecabPos('道', '名詞', 'みち')
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe('4')
    expect(res[0].kana).toEqual(['みち'])
  })

  it('kanji lookup without a reading returns all readings', async () => {
    const res = await getByKanjiAndMecabPos('道', '名詞')
    expect(res).toHaveLength(2)
    expect(res.map((r) => r.kana[0]).sort()).toEqual(['どう', 'みち'])
  })

  it('senses are filtered to those applying to the matched reading', async () => {
    const res = await getByKanjiAndMecabPos('明日', '名詞', 'あした')
    expect(res).toHaveLength(1)
    expect(res[0].kana).toEqual(['あした'])
    expect(res[0].sense.flatMap((s) => s.gloss)).toEqual(['tomorrow'])
  })

  it('a reading that applies to a sense keeps that sense', async () => {
    const res = await getByKanjiAndMecabPos('明日', '名詞', 'あす')
    expect(res).toHaveLength(1)
    expect(res[0].kana).toEqual(['あす'])
    expect(res[0].sense.flatMap((s) => s.gloss).sort()).toEqual(['near future', 'tomorrow'])
  })

  it('falls back to kanji-only lookup when the reading matches nothing', async () => {
    const res = await getByKanjiAndMecabPos('道', '名詞', 'じぇいく')
    expect(res).toHaveLength(2)
  })
})
