import { describe, expect, it } from 'vitest'
import { jmdictToMecabPOS } from './types.dict.js'
import { getMecabPosFormTags } from './db/setupInserts.dict.js'

describe('jmdictToMecabPOS mapping', () => {
  it('maps pronoun (pn) senses to MeCab 名詞 (first feature field for pronouns)', () => {
    expect(jmdictToMecabPOS.pn).toContain('名詞')
  })

  it('resolves pn tags to the 名詞 mecab pos id', () => {
    const map = { 名詞: 10, 代名詞: 20 }
    expect(getMecabPosFormTags(['pn'], map)).toEqual([10])
  })

  it('maps interjection (int) senses to both 感動詞 and フィラー', () => {
    expect(jmdictToMecabPOS.int).toEqual(expect.arrayContaining(['感動詞', 'フィラー']))
  })

  it('resolves int tags to the 感動詞 and フィラー mecab pos ids', () => {
    const map = { 感動詞: 1, フィラー: 2 }
    expect(getMecabPosFormTags(['int'], map)).toEqual([1, 2])
  })

  it('maps counter (ctr) senses to both 接尾 and 名詞', () => {
    expect(jmdictToMecabPOS.ctr).toEqual(expect.arrayContaining(['接尾', '名詞']))
  })

  it('resolves ctr tags to the 接尾 and 名詞 mecab pos ids', () => {
    const map = { 接尾: 1, 名詞: 2 }
    expect(getMecabPosFormTags(['ctr'], map)).toEqual([1, 2])
  })
})
