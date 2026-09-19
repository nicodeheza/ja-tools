import { beforeEach, describe, expect, it, afterEach } from 'vitest'
import { existsSync } from 'node:fs'
import { DB_PATH, DictDb } from './db.dict.js'
import { getByKanaAndMecabPos, getByKanjiAndMecabPos } from '../index.dict.js'
import { haveKanji } from '../../analyzer/utils.analyzer.js'

const cases: Array<[string, string]> = [
  ['これ', '名詞'],
  ['それ', '名詞'],
  ['いい', '形容詞'],
  ['あの', 'フィラー'],
  ['あの', '連体詞'],
  ['です', '助動詞'],
  ['は', '助詞'],
  ['が', '助詞'],
  ['本', '名詞'],
  ['先生', '名詞'],
]

async function lookup(word: string, pos: string) {
  return haveKanji(word) ? getByKanjiAndMecabPos(word, pos) : getByKanaAndMecabPos(word, pos)
}

describe.skipIf(!existsSync(DB_PATH))('dictionary integration (real dictDb)', () => {
  beforeEach(() => {
    DictDb.open(true)
  })

  afterEach(() => {
    DictDb.close()
  })

  it.each(cases)('%s (%s) is findable', async (word, pos) => {
    const res = await lookup(word, pos)
    expect(res.length, `no dictionary entry for ${word} (${pos})`).toBeGreaterThanOrEqual(1)
  })
})
