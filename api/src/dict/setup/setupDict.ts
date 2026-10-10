import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadJmdict } from './jmdictXmlStream.js'
import { DictDb } from '../db/db.dict.js'
import { insertMecabPos, insertTags, insertToDict } from '../db/setupInserts.dict.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupDict(file: string) {
  console.log('open db')
  DictDb.open()

  const path = join(__dirname, file)

  let mecabMap: Record<string, number>
  let tagsMap: Record<string, number>

  console.log('Loading metadata...')
  await new Promise<void>((resolve) => {
    loadJmdict(path)
      .onMetadata(async (tags) => {
        console.log('inserting metadata')
        const [tagMap, mecab] = await Promise.all([insertTags(tags), insertMecabPos()])
        console.log('metadata ready')
        mecabMap = mecab
        tagsMap = tagMap
        resolve()
      })
      .onEntry(() => {})
      .onEnd(() => {})
  })

  console.log('Processing entries...')
  let count = 0
  await new Promise<void>((resolve) => {
    loadJmdict(path)
      .onMetadata(() => {})
      .onEntry((entry) => {
        insertToDict(entry, mecabMap, tagsMap)
        count++
      })
      .onEnd(() => resolve())
  })

  console.log('Done!', count, 'entries')
  DictDb.close()
}

setupDict('../../../jmDict/JMdict_e').catch(console.error)
