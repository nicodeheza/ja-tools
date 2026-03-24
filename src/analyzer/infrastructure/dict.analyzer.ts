import {Cache} from '../../cache/index.cache.js'
import {getByKanaAndMecabPos, getByKanjiAndMecabPos} from '../../dict/index.dict.js'
import {DictWord} from '../types.analyzer.js'
import {haveKanji} from '../utils.analyzer.js'

export const dictCache = new Cache<DictWord[]>(100)

export async function dictLookup(text: string, mecabPos: string): Promise<DictWord[]> {
	const key = `${text}-${mecabPos}`
	const cacheRes = dictCache.get(key)
	if (cacheRes) return cacheRes

	if (haveKanji(text)) {
		const res = await getByKanjiAndMecabPos(text, mecabPos)
		dictCache.add(key, res)
		return res
	}

	const res = await getByKanaAndMecabPos(text, mecabPos)
	dictCache.add(key, res)
	return res
}
