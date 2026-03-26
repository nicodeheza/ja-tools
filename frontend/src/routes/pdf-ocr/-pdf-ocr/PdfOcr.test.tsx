import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import {render, screen, cleanup, waitFor, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {PdfOcr} from './PdfOcr.page'
import * as ocrInfrastructure from './infrastructure/ocr.infrastructure'
import * as analyzeApi from '../../../api/analyze.api'
import type {OcrResult} from './pdfOcr.types'

// vi.hoisted ensures mockPdf is initialized before the hoisted vi.mock call
const mockPdf = vi.hoisted(() => ({
	loadPdf: vi.fn(),
	renderPage: vi.fn(),
	totalPages: 3,
	name: 'test.pdf'
}))

vi.mock('./infrastructure/pdf.infrastructure.js', () => ({
	pdf: mockPdf
}))

vi.mock('./infrastructure/ocr.infrastructure')
vi.mock('../../../api/analyze.api')

const testFile = new File(['pdf content'], 'test.pdf', {type: 'application/pdf'})

// Uploads a file and waits until the PDF loads successfully (nav buttons become enabled)
async function uploadPdf(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole('button', {name: 'Upload a PDF'}))
	const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
	await user.upload(fileInput, testFile)
	await waitFor(() => {
		expect(screen.getByRole('button', {name: '>'})).not.toBeDisabled()
	})
}

describe('PdfOcr', () => {
	beforeEach(() => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		mockPdf.renderPage.mockResolvedValue(undefined)
		// jsdom does not implement canvas — stub getContext so useLoadPage can run
		HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({})
		vi.mocked(ocrInfrastructure.ocrInit).mockResolvedValue(undefined)
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('should be possible to load a pdf', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
		})
		await user.click(screen.getByRole('button', {name: 'Upload a PDF'}))
		const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
		await user.upload(fileInput, testFile)

		expect(mockPdf.loadPdf).toHaveBeenCalledWith(testFile)
	})

	it('should display total pages', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
		})
		await uploadPdf(user)

		expect(screen.getByRole('status', {name: 'Total pages'})).toHaveTextContent('3')
	})

	it('should render the page', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
		})
		await uploadPdf(user)

		const canvas = document.querySelector('canvas')
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 1)
	})

	it('should be possible to go to the next page', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
		})
		await uploadPdf(user)

		expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(1)

		await user.click(screen.getByRole('button', {name: '>'}))

		const canvas = document.querySelector('canvas')
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 2)
		expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(2)
	})

	it('should be possible to go back to the previous page', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await waitFor(() => {
			expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
		})
		await uploadPdf(user)

		// Advance to page 2
		await user.click(screen.getByRole('button', {name: '>'}))
		const canvas = document.querySelector('canvas')
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 2)
		expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(2)

		// Go back to page 1
		await user.click(screen.getByRole('button', {name: '<'}))
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 1)
		expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(1)
	})

	describe('page input', () => {
		afterEach(() => {
			vi.useRealTimers()
		})

		it('should be possible to go to a page using the page input', async () => {
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(userEvent.setup())

			vi.useFakeTimers({shouldAdvanceTime: true})
			const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime})

			const pageInput = screen.getByRole('spinbutton', {name: 'Page'})
			expect(pageInput).toHaveValue(1)
			await user.clear(pageInput)
			await user.type(pageInput, '2')
			vi.advanceTimersByTime(500)

			const canvas = document.querySelector('canvas')
			await waitFor(() => {
				expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 2)
			})
			expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(2)
		})
	})

	describe('ocr', () => {
		const mockOcrResults: OcrResult[] = [
			{text: '認識', box: {x: 10, y: 20, w: 100, h: 30}},
			{text: 'テスト', box: {x: 10, y: 60, w: 120, h: 30}}
		]

		const mockAnalyzeResponse = {
			dict: {
				'entry-1': {
					kanji: ['認識'],
					kana: ['にんしき'],
					sense: [{pos: ['noun'], gloss: ['recognition', 'awareness']}]
				},
				'entry-2': {
					kanji: ['テスト'],
					kana: ['テスト'],
					sense: [{pos: ['noun'], gloss: ['test']}]
				}
			},
			result: [
				[
					{
						original: '認識',
						furigana: '認識[にんしき]',
						isWord: true as const,
						basicForm: '認識',
						dictIds: ['entry-1']
					}
				],
				[
					{
						original: 'テスト',
						furigana: 'テスト',
						isWord: true as const,
						basicForm: 'テスト',
						dictIds: ['entry-2']
					}
				]
			]
		}

		beforeEach(() => {
			vi.mocked(ocrInfrastructure.ocrInit).mockResolvedValue(undefined)
			vi.mocked(ocrInfrastructure.detect).mockResolvedValue(mockOcrResults)
			vi.mocked(analyzeApi.getBulkTextAnalyzedRes).mockResolvedValue(mockAnalyzeResponse)
			HTMLCanvasElement.prototype.toDataURL = vi
				.fn()
				.mockReturnValue('data:image/png;base64,abc')
		})

		it('should disable the button and show "OCR Loading" label while OCR is in progress', async () => {
			const user = userEvent.setup()
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(user)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'OCR Document'})).not.toBeDisabled()
			})

			vi.mocked(ocrInfrastructure.detect).mockReturnValue(new Promise(() => {}))

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			const ocrButton = screen.getByRole('button', {name: 'OCR Loading'})
			expect(ocrButton).toBeDisabled()
		})

		it('should display OCR results when OCR button is clicked', async () => {
			const user = userEvent.setup()
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(user)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'OCR Document'})).not.toBeDisabled()
			})

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			await waitFor(() => {
				expect(screen.getByText('認識')).toBeInTheDocument()
				expect(screen.getByText('テスト')).toBeInTheDocument()
			})
		})

		it('should replace OCR results when OCR is run again', async () => {
			const user = userEvent.setup()
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(user)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'OCR Document'})).not.toBeDisabled()
			})

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			await waitFor(() => {
				expect(screen.getByText('認識')).toBeInTheDocument()
			})

			const newResults: OcrResult[] = [{text: '新しい', box: {x: 0, y: 0, w: 80, h: 30}}]
			vi.mocked(ocrInfrastructure.detect).mockResolvedValue(newResults)
			vi.mocked(analyzeApi.getBulkTextAnalyzedRes).mockResolvedValue({
				dict: {
					'entry-3': {
						kanji: ['新しい'],
						kana: ['あたらしい'],
						sense: [{pos: ['adjective'], gloss: ['new']}]
					}
				},
				result: [
					[
						{
							original: '新しい',
							furigana: '新[あたら]しい',
							isWord: true as const,
							basicForm: '新しい',
							dictIds: ['entry-3']
						}
					]
				]
			})

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			await waitFor(() => {
				expect(screen.getByText('新しい')).toBeInTheDocument()
				expect(screen.queryByText('認識')).not.toBeInTheDocument()
				expect(screen.queryByText('テスト')).not.toBeInTheDocument()
			})
		})

		it('should call analyze API with OCR texts and display analyzed tokens', async () => {
			const user = userEvent.setup()
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(user)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'OCR Document'})).not.toBeDisabled()
			})

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			await waitFor(() => {
				expect(analyzeApi.getBulkTextAnalyzedRes).toHaveBeenCalledWith(['認識', 'テスト'])
			})

			await waitFor(() => {
				expect(screen.getByText('認識')).toBeInTheDocument()
				expect(screen.getByText('テスト')).toBeInTheDocument()
			})
		})

		it('should show dictionary tooltip when clicking a word in the OCR result', async () => {
			const user = userEvent.setup()
			render(<PdfOcr />)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'Upload a PDF'})).toBeInTheDocument()
			})
			await uploadPdf(user)

			await waitFor(() => {
				expect(screen.getByRole('button', {name: 'OCR Document'})).not.toBeDisabled()
			})

			await user.click(screen.getByRole('button', {name: 'OCR Document'}))

			await waitFor(() => {
				expect(screen.getByText('認識')).toBeInTheDocument()
			})

			await user.click(screen.getByText('認識'))

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument()
			})

			const dialog = screen.getByRole('dialog')
			expect(within(dialog).getByText('noun')).toBeInTheDocument()
			expect(within(dialog).getByText('recognition')).toBeInTheDocument()
			expect(within(dialog).getByText('awareness')).toBeInTheDocument()
		})
	})
})
