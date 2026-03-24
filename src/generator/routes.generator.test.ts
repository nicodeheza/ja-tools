import {describe, expect, it, vi} from 'vitest'
import express from 'express'
import routes from './routes.generator.js'
import request from 'supertest'
import * as aiModule from '../infrastructure/Ai/index.ai.js'
import * as tokenizeModule from '../infrastructure/tokenizer/index.tokenizer.js'
import * as dictDbQueriesModule from '../dict/db/queries.dict.js'
import {beforeEach} from 'node:test'
import {dictCache} from '../analyzer/infrastructure/dict.analyzer.js'

vi.mock('../infrastructure/Ai/index.ai.js')
vi.mock('../infrastructure/tokenizer/index.tokenizer.js')
vi.mock('../dict/db/queries.dict.js')

const app = express()
app.use(routes)

describe('Generator Routes', () => {
	beforeEach(() => {
		dictCache.clear()
	})
	describe('GET /story', () => {
		it('should stream analyzed AI generated text via SSE', async () => {
			vi.mocked(aiModule.aiStreamResponse).mockImplementation(async function* () {
				yield '私の名前'
				yield 'はジョンです\n'
				yield '(My name'
				yield 'is John)\n'
			})

			vi.mocked(tokenizeModule.tokenize).mockResolvedValue([
				{
					id: 0,
					surface: '私',
					feature: {
						pos: '名詞',
						posSubs: ['代名詞', '一般', undefined],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: '私',
						reading: 'ワタシ',
						pronunciation: 'ワタシ'
					}
				},
				{
					id: 1,
					surface: 'の',
					feature: {
						pos: '助詞',
						posSubs: ['連体化', undefined, undefined],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: 'の',
						reading: 'ノ',
						pronunciation: 'ノ'
					}
				},
				{
					id: 2,
					surface: '名前',
					feature: {
						pos: '名詞',
						posSubs: ['一般', undefined, undefined],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: '名前',
						reading: 'ナマエ',
						pronunciation: 'ナマエ'
					}
				},
				{
					id: 3,
					surface: 'は',
					feature: {
						pos: '助詞',
						posSubs: ['係助詞', undefined, undefined],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: 'は',
						reading: 'ハ',
						pronunciation: 'ワ'
					}
				},
				{
					id: 4,
					surface: 'ジョン',
					feature: {
						pos: '名詞',
						posSubs: ['固有名詞', '人名', '名'],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: 'ジョン',
						reading: 'ジョン',
						pronunciation: 'ジョン'
					}
				},
				{
					id: 5,
					surface: 'です',
					feature: {
						pos: '助動詞',
						posSubs: [undefined, undefined, undefined],
						conjugatedType: '特殊・デス',
						conjugatedForm: '基本形',
						basicForm: 'です',
						reading: 'デス',
						pronunciation: 'デス'
					}
				},
				{
					id: 6,
					surface: '\n',
					feature: {
						pos: '記号',
						posSubs: ['空白', undefined, undefined],
						conjugatedType: undefined,
						conjugatedForm: undefined,
						basicForm: undefined,
						reading: undefined,
						pronunciation: undefined
					}
				}
			])

			vi.mocked(dictDbQueriesModule.getByKanaAndMecabPosQuery).mockImplementation(
				async (kana: string, mecabPosText: string) => {
					// の
					if (kana === 'の' && mecabPosText === '助詞') {
						return [
							{
								id: 1005,
								kana: 'の',
								kanji: '',
								senseId: 1,
								gloss: 'indicates possessive',
								pos: 'prt',
								mecab: '助詞'
							},
							{
								id: 1005,
								kana: 'の',
								kanji: '',
								senseId: 1,
								gloss: 'nominalizes verbs and adjectives',
								pos: 'prt',
								mecab: '助詞'
							}
						]
					}
					// は
					if (kana === 'は' && mecabPosText === '助詞') {
						return [
							{
								id: 1003,
								kana: 'は',
								kanji: '',
								senseId: 1,
								gloss: 'topic marker particle',
								pos: 'prt',
								mecab: '助詞'
							},
							{
								id: 1003,
								kana: 'は',
								kanji: '',
								senseId: 1,
								gloss: 'indicates contrast with another option',
								pos: 'prt',
								mecab: '助詞'
							}
						]
					}
					// です
					if (kana === 'です' && mecabPosText === '助動詞') {
						return [
							{
								id: 1004,
								kana: 'です',
								kanji: '',
								senseId: 1,
								gloss: 'be',
								pos: 'cop',
								mecab: '助動詞'
							},
							{
								id: 1004,
								kana: 'です',
								kanji: '',
								senseId: 1,
								gloss: 'is',
								pos: 'cop',
								mecab: '助動詞'
							}
						]
					}
					return []
				}
			)

			vi.mocked(dictDbQueriesModule.getByKanjiAndMecabPosQuery).mockImplementation(
				async (kanji: string, mecabPosText: string) => {
					// 私
					if (kanji === '私' && mecabPosText === '名詞') {
						return [
							{
								id: 1000,
								kana: 'わたし',
								kanji: '私',
								senseId: 1,
								gloss: 'I',
								pos: 'pn',
								mecab: '名詞'
							},
							{
								id: 1000,
								kana: 'わたし',
								kanji: '私',
								senseId: 1,
								gloss: 'me',
								pos: 'pn',
								mecab: '名詞'
							}
						]
					}
					// 名前
					if (kanji === '名前' && mecabPosText === '名詞') {
						return [
							{
								id: 1002,
								kana: 'なまえ',
								kanji: '名前',
								senseId: 1,
								gloss: 'name',
								pos: 'n',
								mecab: '名詞'
							},
							{
								id: 1002,
								kana: 'なまえ',
								kanji: '名前',
								senseId: 1,
								gloss: 'full name',
								pos: 'n',
								mecab: '名詞'
							}
						]
					}
					return []
				}
			)

			const response = await request(app)
				.get('/story')
				.query({p: 'test prompt'})
				.buffer(true)
				.parse((res, callback) => {
					let data = ''
					res.on('data', (chunk) => {
						data += chunk.toString()
					})
					res.on('end', () => {
						callback(null, data)
					})
				})

			expect(response.status).toEqual(200)
			expect(response.headers['content-type']).toEqual('text/event-stream')
			expect(response.headers['cache-control']).toEqual('no-cache')
			expect(response.headers['connection']).toEqual('keep-alive')

			// Parse SSE messages
			const messages = response.body
				.split('\n\n')
				.filter((msg: string) => msg.startsWith('data: '))
				.map((msg: string) => JSON.parse(msg.replace('data: ', '')))

			// Verify the stream contains expected data
			expect(messages.length).toBeGreaterThan(0)
			expect(messages[messages.length - 1]).toEqual({message: 'done'})
			expect(messages).toEqual([
				{
					paragraph: {
						text: '私の名前はジョンです',
						translation: 'My nameis John',
						tokens: [
							{
								isWord: true,
								original: '私',
								mecabPos: '名詞',
								basicForm: '私',
								furigana: '私[わたし]',
								dictIds: ['1000']
							},
							{
								isWord: true,
								original: 'の',
								mecabPos: '助詞',
								basicForm: 'の',
								dictIds: ['1005']
							},
							{
								isWord: true,
								original: '名前',
								mecabPos: '名詞',
								basicForm: '名前',
								furigana: '名[な] 前[まえ]',
								dictIds: ['1002']
							},
							{
								isWord: true,
								original: 'は',
								mecabPos: '助詞',
								basicForm: 'は',
								dictIds: ['1003']
							},
							{
								isWord: true,
								original: 'ジョン',
								mecabPos: '名詞',
								basicForm: 'ジョン',
								dictIds: []
							},
							{
								isWord: true,
								original: 'です',
								mecabPos: '助動詞',
								basicForm: 'です',
								dictIds: ['1004']
							},
							{
								isWord: false,
								original: '\n'
							}
						]
					},
					dict: {
						'1000': {
							kana: ['わたし'],
							kanji: ['私'],
							mecabPos: ['名詞'],
							sense: [
								{
									gloss: ['I', 'me'],
									pos: ['pn']
								}
							]
						},
						'1002': {
							kana: ['なまえ'],
							kanji: ['名前'],
							mecabPos: ['名詞'],
							sense: [
								{
									gloss: ['name', 'full name'],
									pos: ['n']
								}
							]
						},
						'1003': {
							kana: ['は'],
							kanji: [''],
							mecabPos: ['助詞'],
							sense: [
								{
									gloss: [
										'topic marker particle',
										'indicates contrast with another option'
									],
									pos: ['prt']
								}
							]
						},
						'1004': {
							kana: ['です'],
							kanji: [''],
							mecabPos: ['助動詞'],
							sense: [
								{
									gloss: ['be', 'is'],
									pos: ['cop']
								}
							]
						},
						'1005': {
							kana: ['の'],
							kanji: [''],
							mecabPos: ['助詞'],
							sense: [
								{
									gloss: ['indicates possessive', 'nominalizes verbs and adjectives'],
									pos: ['prt']
								}
							]
						}
					}
				},
				{
					message: 'done'
				}
			])
		})
	})
})
