import { createReadStream } from 'fs'
import { SaxesParser } from 'saxes'
import type { JmdictWord } from './jmdict.types.js'

const COMMON_PRI = new Set(['news1', 'ichi1', 'spec1', 'spec2', 'gai1'])

const ENTITY_RE = /<!ENTITY\s+(\S+)\s+"([^"]*)">/g

const TEXT_ELEMENTS = new Set([
  'ent_seq',
  'keb',
  'ke_pri',
  'reb',
  're_pri',
  're_restr',
  'pos',
  'stagk',
  'stagr',
  'gloss',
])

interface KanjiAcc {
  text: string
  pri: string[]
}

interface KanaAcc {
  text: string
  pri: string[]
  reRestr: string[]
  noKanji: boolean
}

interface SenseAcc {
  pos: string[]
  stagk: string[]
  stagr: string[]
  gloss: string[]
}

type MetadataHandler = (tags: Record<string, string>) => void
type EntryHandler = (entry: JmdictWord) => void

export interface JmdictStream {
  onMetadata(handler: MetadataHandler): JmdictStream
  onEntry(handler: EntryHandler): JmdictStream
  onEnd(handler: () => void): JmdictStream
}

function priToCommon(pri: string[]): boolean {
  return pri.some((p) => COMMON_PRI.has(p))
}

function priToNf(pri: string[]): number | null {
  for (const p of pri) {
    const m = /^nf(\d+)$/.exec(p)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

function buildParser(callbacks: {
  onMetadata: MetadataHandler
  onEntry: EntryHandler
  onEnd: () => void
}): SaxesParser {
  const parser = new SaxesParser({ position: false, xmlns: false })

  let textBuf = ''
  let captureText = false

  let entry: JmdictWord | null = null
  let kanji: KanjiAcc | null = null
  let kana: KanaAcc | null = null
  let sense: SenseAcc | null = null
  let carryPos: string[] = []

  parser.on('doctype', (doctype) => {
    const tags: Record<string, string> = {}
    ENTITY_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = ENTITY_RE.exec(doctype))) {
      const name = m[1]
      tags[name] = m[2]
      parser.ENTITIES[name] = name
    }
    callbacks.onMetadata(tags)
  })

  parser.on('opentag', (tag) => {
    const name = tag.name

    if (name === 'entry') {
      entry = { id: '', kanji: [], kana: [], sense: [] }
    } else if (name === 'k_ele') {
      kanji = { text: '', pri: [] }
    } else if (name === 'r_ele') {
      kana = { text: '', pri: [], reRestr: [], noKanji: false }
    } else if (name === 'sense') {
      sense = { pos: [], stagk: [], stagr: [], gloss: [] }
    } else if (name === 're_nokanji' && kana) {
      kana.noKanji = true
    }

    if (TEXT_ELEMENTS.has(name)) {
      textBuf = ''
      captureText = true
    } else {
      captureText = false
    }
  })

  parser.on('text', (text) => {
    if (captureText) textBuf += text
  })

  parser.on('closetag', (tag) => {
    const name = tag.name

    if (TEXT_ELEMENTS.has(name)) {
      const value = textBuf
      if (name === 'ent_seq') {
        if (entry) entry.id = value
      } else if (name === 'keb') {
        if (kanji) kanji.text = value
      } else if (name === 'ke_pri') {
        if (kanji) kanji.pri.push(value)
      } else if (name === 'reb') {
        if (kana) kana.text = value
      } else if (name === 're_pri') {
        if (kana) kana.pri.push(value)
      } else if (name === 're_restr') {
        if (kana) kana.reRestr.push(value)
      } else if (name === 'pos') {
        if (sense) sense.pos.push(value)
      } else if (name === 'stagk') {
        if (sense) sense.stagk.push(value)
      } else if (name === 'stagr') {
        if (sense) sense.stagr.push(value)
      } else if (name === 'gloss') {
        if (sense) sense.gloss.push(value)
      }
    } else if (name === 'k_ele') {
      if (entry && kanji) {
        entry.kanji.push({
          text: kanji.text,
          common: priToCommon(kanji.pri),
          nf: priToNf(kanji.pri),
        })
        kanji = null
      }
    } else if (name === 'r_ele') {
      if (entry && kana) {
        const appliesToKanji = kana.noKanji ? [] : kana.reRestr.length > 0 ? kana.reRestr : ['*']
        entry.kana.push({
          text: kana.text,
          common: priToCommon(kana.pri),
          nf: priToNf(kana.pri),
          appliesToKanji,
        })
        kana = null
      }
    } else if (name === 'sense') {
      if (entry && sense) {
        const partOfSpeech = sense.pos.length > 0 ? sense.pos : carryPos
        carryPos = partOfSpeech
        entry.sense.push({
          partOfSpeech,
          appliesToKanji: sense.stagk.length > 0 ? sense.stagk : ['*'],
          appliesToKana: sense.stagr.length > 0 ? sense.stagr : ['*'],
          gloss: sense.gloss.map((text) => ({ text })),
        })
        sense = null
      }
    } else if (name === 'entry') {
      if (entry) callbacks.onEntry(entry)
      entry = null
      carryPos = []
    }
  })

  parser.on('error', () => {})
  parser.on('end', () => callbacks.onEnd())

  return parser
}

export function parseJmdictXml(
  xml: string,
  callbacks: {
    onMetadata: MetadataHandler
    onEntry: EntryHandler
    onEnd: () => void
  }
): void {
  const parser = buildParser(callbacks)
  parser.write(xml).close()
}

export function loadJmdict(filePath: string): JmdictStream {
  let metadataHandler: MetadataHandler | undefined
  let entryHandler: EntryHandler | undefined
  let endHandler: (() => void) | undefined

  const parser = buildParser({
    onMetadata: (tags) => metadataHandler?.(tags),
    onEntry: (entry) => entryHandler?.(entry),
    onEnd: () => endHandler?.(),
  })

  createReadStream(filePath, { encoding: 'utf8' })
    .on('data', (chunk: string | Buffer) => {
      parser.write(typeof chunk === 'string' ? chunk : chunk.toString('utf8'))
    })
    .on('end', () => {
      parser.close()
    })

  const stream: JmdictStream = {
    onMetadata(handler) {
      metadataHandler = handler
      return stream
    },
    onEntry(handler) {
      entryHandler = handler
      return stream
    },
    onEnd(handler) {
      endHandler = handler
      return stream
    },
  }

  return stream
}
