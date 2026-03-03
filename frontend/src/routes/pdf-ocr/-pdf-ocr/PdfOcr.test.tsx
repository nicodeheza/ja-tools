import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import {render, screen, cleanup, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {PdfOcr} from './PdfOcr.page'

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
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('should be possible to load a pdf', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await user.click(screen.getByRole('button', {name: 'Upload a PDF'}))
		const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
		await user.upload(fileInput, testFile)

		expect(mockPdf.loadPdf).toHaveBeenCalledWith(testFile)
	})

	it('should display total pages', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await uploadPdf(user)

		expect(screen.getByRole('status', {name: 'Total pages'})).toHaveTextContent('3')
	})

	it('should render the page', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await uploadPdf(user)

		const canvas = document.querySelector('canvas')
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 1)
	})

	it('should be possible to go to the next page', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

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

	// NOTE: known bug — clearing the controlled number input doesn't reset the React state,
	// so typing "2" after clear results in "12" instead. Use it.fails until the bug is fixed.
	it('should be possible to go to a page using the page input', async () => {
		const user = userEvent.setup()
		render(<PdfOcr />)

		await uploadPdf(user)

		const pageInput = screen.getByRole('spinbutton', {name: 'Page'})
		expect(pageInput).toHaveValue(1)
		await user.clear(pageInput)
		await user.type(pageInput, '2')

		const canvas = document.querySelector('canvas')
		expect(mockPdf.renderPage).toHaveBeenCalledWith(canvas, 2)
		expect(screen.getByRole('spinbutton', {name: 'Page'})).toHaveValue(2)
	})
})
