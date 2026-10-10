import { describe, expect, it } from 'vitest'
import { parseJmdictXml } from './jmdictXmlStream.js'
import type { JmdictWord } from './jmdict.types.js'

const DOCTYPE = `<!DOCTYPE JMdict [
<!ENTITY n "noun (common) (futsuumeishi)">
<!ENTITY adv "adverb (fukushi)">
<!ENTITY unc "unclassified">
]>`

function parse(xml: string): JmdictWord[] {
  const entries: JmdictWord[] = []
  parseJmdictXml(`<?xml version="1.0"?>${DOCTYPE}<JMdict>${xml}</JMdict>`, {
    onMetadata: () => {},
    onEntry: (entry) => entries.push(entry),
    onEnd: () => {},
  })
  return entries
}

describe('jmdict XML parser', () => {
  it('parses id, kanji, kana and sense (with entity-resolved pos)', () => {
    const [e] = parse(`
      <entry><ent_seq>1579110</ent_seq>
      <k_ele><keb>今日</keb><ke_pri>ichi1</ke_pri><ke_pri>nf03</ke_pri></k_ele>
      <r_ele><reb>きょう</reb><re_pri>news1</re_pri><re_pri>nf03</re_pri></r_ele>
      <sense><pos>&n;</pos><gloss>today</gloss></sense>
      </entry>`)

    expect(e.id).toBe('1579110')
    expect(e.kanji).toEqual([{ text: '今日', common: true, nf: 3 }])
    expect(e.kana).toEqual([{ text: 'きょう', common: true, nf: 3, appliesToKanji: ['*'] }])
    expect(e.sense).toEqual([
      {
        partOfSpeech: ['n'],
        appliesToKanji: ['*'],
        appliesToKana: ['*'],
        gloss: [{ text: 'today' }],
      },
    ])
  })

  it('carries POS forward to senses that omit it', () => {
    const [e] = parse(`
      <entry><ent_seq>1</ent_seq>
      <r_ele><reb>テスト</reb></r_ele>
      <sense><pos>&n;</pos><gloss>a</gloss></sense>
      <sense><gloss>b</gloss></sense>
      <sense><pos>&adv;</pos><gloss>c</gloss></sense>
      </entry>`)

    expect(e.sense.map((s) => s.partOfSpeech)).toEqual([['n'], ['n'], ['adv']])
  })

  it('leaves nf null and common false when there are no priority tags', () => {
    const [e] = parse(`
      <entry><ent_seq>1</ent_seq>
      <k_ele><keb>香</keb></k_ele>
      <r_ele><reb>きょう</reb></r_ele>
      <sense><gloss>x</gloss></sense>
      </entry>`)

    expect(e.kanji).toEqual([{ text: '香', common: false, nf: null }])
    expect(e.kana).toEqual([{ text: 'きょう', common: false, nf: null, appliesToKanji: ['*'] }])
  })

  it('maps stagk/stagr to appliesToKanji/appliesToKana and defaults to *', () => {
    const [e] = parse(`
      <entry><ent_seq>1</ent_seq>
      <k_ele><keb>甲乙</keb></k_ele>
      <r_ele><reb>こう</reb></r_ele>
      <r_ele><reb>おつ</reb></r_ele>
      <sense><stagk>甲乙</stagk><stagr>こう</stagr><gloss>a</gloss></sense>
      <sense><gloss>b</gloss></sense>
      </entry>`)

    expect(e.sense[0].appliesToKanji).toEqual(['甲乙'])
    expect(e.sense[0].appliesToKana).toEqual(['こう'])
    expect(e.sense[1].appliesToKanji).toEqual(['*'])
    expect(e.sense[1].appliesToKana).toEqual(['*'])
  })

  it('derives kana appliesToKanji from re_restr, re_nokanji and default', () => {
    const [e] = parse(`
      <entry><ent_seq>1</ent_seq>
      <k_ele><keb>甲</keb></k_ele>
      <k_ele><keb>乙</keb></k_ele>
      <r_ele><reb>こう</reb><re_restr>甲</re_restr></r_ele>
      <r_ele><reb>おつ</reb></r_ele>
      <r_ele><reb>かな</reb><re_nokanji/></r_ele>
      <sense><gloss>x</gloss></sense>
      </entry>`)

    expect(e.kana.map((k) => k.appliesToKanji)).toEqual([['甲'], ['*'], []])
  })

  it('captures gloss text and ignores attributes', () => {
    const [e] = parse(`
      <entry><ent_seq>1</ent_seq>
      <r_ele><reb>ヾ</reb></r_ele>
      <sense><gloss g_type="expl">voiced repetition mark</gloss></sense>
      </entry>`)

    expect(e.sense[0].gloss).toEqual([{ text: 'voiced repetition mark' }])
  })
})
