import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import Ocr from '@gutenye/ocr-browser'
import {detect, ocrInit} from './ocr.infrastructure'

vi.mock('@gutenye/ocr-browser', () => ({
	default: {
		create: vi.fn()
	}
}))

describe('ocr.infrastructure', () => {
	let mockDetect: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		mockDetect = vi.fn()
		vi.mocked(Ocr.create).mockResolvedValue({detect: mockDetect} as unknown as Ocr)
		await ocrInit()
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	describe('detect', () => {
		it('should map a typical 4-point bounding box to {x, y, w, h}', async () => {
			mockDetect.mockResolvedValue([
				{
					text: 'hello',
					box: [
						[10, 20],
						[110, 20],
						[110, 60],
						[10, 60]
					]
				}
			])

			const result = await detect('data:image/png;base64,abc')

			expect(result).toEqual([{text: 'hello', box: {x: 10, y: 20, w: 100, h: 40}}])
		})

		it('should derive correct bounds from a non-rectangular polygon', async () => {
			mockDetect.mockResolvedValue([
				{
					text: '日本語',
					// Skewed quadrilateral — min/max must be computed across all points
					box: [
						[5, 30],
						[95, 10],
						[100, 70],
						[0, 80]
					]
				}
			])

			const result = await detect('data:image/png;base64,abc')

			expect(result).toEqual([
				{
					text: '日本語',
					box: {
						x: 0,
						y: 10,
						w: 100,
						h: 70
					}
				}
			])
		})

		it('should return a zero box when the line has no points', async () => {
			mockDetect.mockResolvedValue([{text: 'empty', box: []}])

			const result = await detect('data:image/png;base64,abc')

			expect(result).toEqual([{text: 'empty', box: {x: 0, y: 0, w: 0, h: 0}}])
		})

		it('should return a zero box when box is undefined (null-ish)', async () => {
			mockDetect.mockResolvedValue([{text: 'no box', box: undefined}])

			const result = await detect('data:image/png;base64,abc')

			expect(result).toEqual([{text: 'no box', box: {x: 0, y: 0, w: 0, h: 0}}])
		})

		it('should preserve the text field from the raw OCR line', async () => {
			mockDetect.mockResolvedValue([
				{
					text: 'some Japanese text 日本語テスト',
					box: [
						[0, 0],
						[50, 0],
						[50, 20],
						[0, 20]
					]
				}
			])

			const result = await detect('data:image/png;base64,abc')

			expect(result[0].text).toBe('some Japanese text 日本語テスト')
		})

		it('should map all lines in a multi-line result', async () => {
			mockDetect.mockResolvedValue([
				{
					text: 'line one',
					box: [
						[0, 0],
						[40, 0],
						[40, 10],
						[0, 10]
					]
				},
				{
					text: 'line two',
					box: [
						[5, 15],
						[45, 15],
						[45, 25],
						[5, 25]
					]
				}
			])

			const result = await detect('data:image/png;base64,abc')

			expect(result).toHaveLength(2)
			expect(result[0]).toEqual({text: 'line one', box: {x: 0, y: 0, w: 40, h: 10}})
			expect(result[1]).toEqual({text: 'line two', box: {x: 5, y: 15, w: 40, h: 10}})
		})

		it('should throw when OCR is not initialized', async () => {
			// Reset the module to get a fresh, uninitialized OCR state
			vi.resetModules()
			const {detect: freshDetect} = await import('./ocr.infrastructure')

			await expect(freshDetect('data:image/png;base64,abc')).rejects.toThrow(
				'OCR not initialized'
			)
		})
	})
})
