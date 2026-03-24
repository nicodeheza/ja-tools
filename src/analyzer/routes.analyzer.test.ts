import {describe, expect, it, vi, afterEach} from 'vitest'
import express from 'express'
import routes from './routes.analyzer.js'
import request from 'supertest'
import * as tokenizerModule from '../infrastructure/tokenizer/index.tokenizer.js'
import * as dictModule from '../dict/index.dict.js'

vi.mock('../infrastructure/tokenizer/index.tokenizer.js')
vi.mock('../dict/index.dict.js')

const app = express()
app.use(express.json())
app.use(routes)

describe('Analyzer Routes', () => {
	describe('POST /analyze', () => {
		it('should analyze Japanese text and return tokens with dictionary', async () => {
			vi.mocked(tokenizerModule.tokenize).mockResolvedValue([
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

			vi.mocked(dictModule.getByKanaAndMecabPos).mockImplementation(
				async (kana: string, mecabPos: string) => {
					// の
					if (kana === 'の' && mecabPos === '助詞') {
						return [
							{
								id: '1005',
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
						]
					}
					// は
					if (kana === 'は' && mecabPos === '助詞') {
						return [
							{
								id: '1003',
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
							}
						]
					}
					// です
					if (kana === 'です' && mecabPos === '助動詞') {
						return [
							{
								id: '1004',
								kana: ['です'],
								kanji: [''],
								mecabPos: ['助動詞'],
								sense: [
									{
										gloss: ['be', 'is'],
										pos: ['cop']
									}
								]
							}
						]
					}
					return []
				}
			)

			vi.mocked(dictModule.getByKanjiAndMecabPos).mockImplementation(
				async (kanji: string, mecabPos: string) => {
					// 私
					if (kanji === '私' && mecabPos === '名詞') {
						return [
							{
								id: '1000',
								kana: ['わたし'],
								kanji: ['私'],
								mecabPos: ['名詞'],
								sense: [
									{
										gloss: ['I', 'me'],
										pos: ['pn']
									}
								]
							}
						]
					}
					// 名前
					if (kanji === '名前' && mecabPos === '名詞') {
						return [
							{
								id: '1002',
								kana: ['なまえ'],
								kanji: ['名前'],
								mecabPos: ['名詞'],
								sense: [
									{
										gloss: ['name', 'full name'],
										pos: ['n']
									}
								]
							}
						]
					}
					return []
				}
			)

			const response = await request(app)
				.post('/')
				.send({text: '私の名前はジョンです\n'})
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(200)
			expect(response.headers['content-type']).toMatch(/application\/json/)

			// Verify response structure
			expect(response.body).toHaveProperty('tokens')
			expect(response.body).toHaveProperty('dict')

			// Verify tokens
			expect(response.body.tokens).toEqual([
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
			])

			// Verify dict structure
			expect(response.body.dict).toEqual({
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
							gloss: ['topic marker particle', 'indicates contrast with another option'],
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
			})
		})

		it('should return 400 error when text field is missing', async () => {
			const response = await request(app)
				.post('/')
				.send({})
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(400)
			expect(response.body).toEqual({error: 'Text is required'})
		})

		it('should return 400 error when text is empty string', async () => {
			const response = await request(app)
				.post('/')
				.send({text: ''})
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(400)
			expect(response.body).toEqual({error: 'Text is required'})
		})

		it('should return 400 error when text is only whitespace', async () => {
			const response = await request(app)
				.post('/')
				.send({text: '   '})
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(400)
			expect(response.body).toEqual({error: 'Text is required'})
		})
	})

	describe('POST /bulk', () => {
		afterEach(() => {
			vi.clearAllMocks()
		})

		it('should analyze multiple texts and return results in the same order', async () => {
			vi.mocked(tokenizerModule.tokenize)
				.mockResolvedValueOnce([
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
					}
				])
				.mockResolvedValueOnce([
					{
						id: 0,
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
					}
				])

			vi.mocked(dictModule.getByKanjiAndMecabPos).mockResolvedValue([
				{
					id: '1000',
					kana: ['わたし'],
					kanji: ['私'],
					mecabPos: ['名詞'],
					sense: [{gloss: ['I', 'me'], pos: ['pn']}]
				}
			])

			vi.mocked(dictModule.getByKanaAndMecabPos).mockResolvedValue([
				{
					id: '1005',
					kana: ['の'],
					kanji: [''],
					mecabPos: ['助詞'],
					sense: [{gloss: ['indicates possessive'], pos: ['prt']}]
				}
			])

			const response = await request(app)
				.post('/bulk')
				.send(['私', 'の'])
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(200)
			expect(response.body).toHaveProperty('dict')
			expect(response.body).toHaveProperty('result')
			expect(response.body.result).toHaveLength(2)

			// First result: 私
			expect(response.body.result[0][0]).toMatchObject({
				isWord: true,
				original: '私',
				basicForm: '私',
				mecabPos: '名詞'
			})

			// Second result: の (preserves order)
			expect(response.body.result[1][0]).toMatchObject({
				isWord: true,
				original: 'の',
				basicForm: 'の',
				mecabPos: '助詞'
			})

			// Aggregated dict contains entries from both texts
			expect(response.body.dict).toHaveProperty('1000')
			expect(response.body.dict).toHaveProperty('1005')
		})

		it('should return an empty result for blank/whitespace-only strings', async () => {
			vi.mocked(tokenizerModule.tokenize).mockResolvedValue([
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
				}
			])

			vi.mocked(dictModule.getByKanjiAndMecabPos).mockResolvedValue([
				{
					id: '1000',
					kana: ['わたし'],
					kanji: ['私'],
					mecabPos: ['名詞'],
					sense: [{gloss: ['I', 'me'], pos: ['pn']}]
				}
			])

			vi.mocked(dictModule.getByKanaAndMecabPos).mockResolvedValue([])

			const response = await request(app)
				.post('/bulk')
				.send(['私', '', '   '])
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(200)
			expect(response.body.result).toHaveLength(3)

			// First result: valid text
			expect(response.body.result[0][0]).toMatchObject({original: '私'})

			// Second result: empty string → empty tokens
			expect(response.body.result[1]).toEqual([])

			// Third result: whitespace-only → empty tokens
			expect(response.body.result[2]).toEqual([])

			// Dict has entries from the first text only
			expect(response.body.dict).toHaveProperty('1000')
		})

		it('should return 400 when body is not an array', async () => {
			const response = await request(app)
				.post('/bulk')
				.send({})
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(400)
			expect(response.body).toEqual({error: 'Body must be an array of strings'})
		})

		it('should return an empty array when texts is an empty array', async () => {
			const response = await request(app)
				.post('/bulk')
				.send([])
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(200)
			expect(response.body).toEqual({dict: {}, result: []})
		})

		it('should return 400 when body array have invalid values', async () => {
			const response = await request(app)
				.post('/bulk')
				.send([123, null, true])
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(400)
			expect(response.body).toEqual({error: 'Body must be an array of strings'})
		})

		it('should return an empty result for items where analyzeText rejects', async () => {
			vi.mocked(tokenizerModule.tokenize)
				.mockRejectedValueOnce(new Error('tokenizer failure'))
				.mockResolvedValueOnce([
					{
						id: 0,
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
					}
				])

			vi.mocked(dictModule.getByKanaAndMecabPos).mockResolvedValue([
				{
					id: '1005',
					kana: ['の'],
					kanji: [''],
					mecabPos: ['助詞'],
					sense: [{gloss: ['indicates possessive'], pos: ['prt']}]
				}
			])
			vi.mocked(dictModule.getByKanjiAndMecabPos).mockResolvedValue([])

			const response = await request(app)
				.post('/bulk')
				.send(['失敗する', 'の'])
				.set('Content-Type', 'application/json')

			expect(response.status).toEqual(200)
			expect(response.body.result).toHaveLength(2)

			// First item failed → empty tokens
			expect(response.body.result[0]).toEqual([])

			// Second item succeeded
			expect(response.body.result[1][0]).toMatchObject({original: 'の'})

			// Dict only has entries from the second text
			expect(response.body.dict).toHaveProperty('1005')
			expect(response.body.dict).not.toHaveProperty('failed')
		})
	})
})
