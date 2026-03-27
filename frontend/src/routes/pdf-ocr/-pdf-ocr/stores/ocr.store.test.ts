import {describe, expect, it, afterEach} from 'vitest'
import {useOcrStore, resetOcrStore} from './ocr.store'

describe('ocr store', () => {
	afterEach(() => {
		resetOcrStore()
	})

	describe('setOcrPage', () => {
		it('should store data for a given page', () => {
			const data = [{tokens: [], box: {x: 0, y: 0, w: 100, h: 30}}]
			const dict = {'entry-1': {kanji: ['認識'], kana: ['にんしき'], sense: []}}

			useOcrStore.getState().setOcrPage(1, data, dict)

			expect(useOcrStore.getState().ocrData[1]).toEqual(data)
		})

		it('should store data for multiple pages independently', () => {
			const dataPage1 = [{tokens: [], box: {x: 0, y: 0, w: 100, h: 30}}]
			const dataPage2 = [{tokens: [], box: {x: 0, y: 50, w: 80, h: 30}}]

			useOcrStore.getState().setOcrPage(1, dataPage1, {})
			useOcrStore.getState().setOcrPage(2, dataPage2, {})

			expect(useOcrStore.getState().ocrData[1]).toEqual(dataPage1)
			expect(useOcrStore.getState().ocrData[2]).toEqual(dataPage2)
		})

		it('should overwrite existing data for the same page', () => {
			const original = [{tokens: [], box: {x: 0, y: 0, w: 100, h: 30}}]
			const updated = [{tokens: [], box: {x: 5, y: 10, w: 200, h: 40}}]

			useOcrStore.getState().setOcrPage(1, original, {})
			useOcrStore.getState().setOcrPage(1, updated, {})

			expect(useOcrStore.getState().ocrData[1]).toEqual(updated)
		})

		it('should merge dict entries across calls without wiping existing entries', () => {
			const dict1 = {'entry-1': {kanji: ['認識'], kana: ['にんしき'], sense: []}}
			const dict2 = {'entry-2': {kanji: ['テスト'], kana: ['テスト'], sense: []}}

			useOcrStore.getState().setOcrPage(1, [], dict1)
			useOcrStore.getState().setOcrPage(2, [], dict2)

			expect(useOcrStore.getState().dict).toEqual({...dict1, ...dict2})
		})

		it('should overwrite a dict entry with the same key on repeated calls', () => {
			const dict1 = {'entry-1': {kanji: ['認識'], kana: ['にんしき'], sense: []}}
			const dict2 = {
				'entry-1': {
					kanji: ['認識'],
					kana: ['にんしき'],
					sense: [{pos: ['noun'], gloss: ['recognition']}]
				}
			}

			useOcrStore.getState().setOcrPage(1, [], dict1)
			useOcrStore.getState().setOcrPage(1, [], dict2)

			expect(useOcrStore.getState().dict['entry-1']).toEqual(dict2['entry-1'])
		})
	})

	describe('resetOcrStore', () => {
		it('should reset ocrData and dict', () => {
			useOcrStore
				.getState()
				.setOcrPage(3, [{tokens: [], box: {x: 0, y: 0, w: 0, h: 0}}], {
					e: {kanji: [], kana: [], sense: []}
				})

			resetOcrStore()

			expect(useOcrStore.getState().ocrData).toEqual({})
			expect(useOcrStore.getState().dict).toEqual({})
		})
	})
})
