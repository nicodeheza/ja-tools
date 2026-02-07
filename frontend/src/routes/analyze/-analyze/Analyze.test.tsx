import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import {render, screen, cleanup, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Analyze} from './Analyze.view'
import {clearAnalyzedTextStore} from './analyze.service'
import * as analyzeApi from '../../../api/analyze.api'
import {analyzeStorage} from './analyze.storage'
import type {AnalyzeData} from './analyze.types'

vi.mock('../../../api/analyze.api')
vi.mock('./analyze.storage')

describe('Analyze', () => {
	beforeEach(() => {
		// Set up default mocks (fresh state with no cached data)
		vi.mocked(analyzeStorage.getData).mockReturnValue(undefined)
		vi.mocked(analyzeApi.getTextAnalyzeRes).mockResolvedValue({
			tokens: mockAnalyzeData.tokens,
			dict: mockAnalyzeData.dict
		})
		vi.mocked(analyzeStorage.saveData).mockImplementation(() => {})
		vi.mocked(analyzeStorage.removeData).mockImplementation(() => {})

		clearAnalyzedTextStore()
	})

	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('renders the input form when status is inactive', () => {
		render(<Analyze />)

		expect(screen.getByRole('textbox')).toBeInTheDocument()
		expect(screen.getByRole('button', {name: /analice/i})).toBeInTheDocument()
	})

	it('requires text input before submission', () => {
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		expect(textarea).toBeRequired()
	})

	it('updates textarea value when user types', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '日本語のテキスト')

		expect(textarea).toHaveValue('日本語のテキスト')
	})

	it('shows loading state when analyzing text', async () => {
		const user = userEvent.setup()
		vi.mocked(analyzeApi.getTextAnalyzeRes).mockImplementation(
			() => new Promise(() => {}) // Never resolves
		)

		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			expect(screen.getByText('Loading...')).toBeInTheDocument()
		})
	})

	it('calls analyzeText API when form is submitted', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			expect(analyzeApi.getTextAnalyzeRes).toHaveBeenCalledWith('猫が好きです')
		})
	})

	it('displays error message when analysis fails', async () => {
		const user = userEvent.setup()
		const errorMessage = 'Failed to analyze text'
		vi.mocked(analyzeApi.getTextAnalyzeRes).mockRejectedValue(new Error(errorMessage))

		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			expect(screen.getByText(errorMessage)).toBeInTheDocument()
		})
	})

	it('saves data to localStorage after successful analysis', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			expect(analyzeStorage.saveData).toHaveBeenCalledWith(mockAnalyzeData)
		})
	})

	it('loads cached data from localStorage on mount', async () => {
		vi.mocked(analyzeStorage.getData).mockReturnValue(mockAnalyzeData)

		render(<Analyze />)

		expect(await screen.findByText('ねこ')).toBeInTheDocument()
		expect(screen.getByText('す')).toBeInTheDocument()
	})

	it('displays analyzed text with furigana after successful analysis', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		// Start from fresh input state
		expect(screen.getByRole('textbox')).toBeInTheDocument()

		await user.type(screen.getByRole('textbox'), '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			// Check that furigana readings are present (inside <rt> tags)
			expect(screen.getByText('ねこ')).toBeInTheDocument()
			expect(screen.getByText('す')).toBeInTheDocument()
		})
	})

	it('displays FuriganaSettings component in success state', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			// Check for furigana settings radio buttons
			expect(screen.getByText('Furigana:')).toBeInTheDocument()
			expect(screen.getByLabelText('Show')).toBeInTheDocument()
			expect(screen.getByLabelText('Hide')).toBeInTheDocument()
			expect(screen.getByLabelText('Hover')).toBeInTheDocument()
		})
	})

	it('displays Clear button in success state', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		await waitFor(() => {
			expect(screen.getByRole('button', {name: /clear/i})).toBeInTheDocument()
		})
	})

	it('clears data and returns to input form when Clear button is clicked', async () => {
		const user = userEvent.setup()
		render(<Analyze />)

		const textarea = screen.getByRole('textbox')
		await user.type(textarea, '猫が好きです')
		await user.click(screen.getByRole('button', {name: /analice/i}))

		// Wait for analysis to complete
		await waitFor(() => {
			expect(screen.getByRole('button', {name: /clear/i})).toBeInTheDocument()
		})

		// Click clear button
		await user.click(screen.getByRole('button', {name: /clear/i}))

		// Should call removeData
		expect(analyzeStorage.removeData).toHaveBeenCalled()

		// Should return to input form
		await waitFor(() => {
			expect(screen.getByRole('textbox')).toBeInTheDocument()
			expect(screen.getByRole('button', {name: /analice/i})).toBeInTheDocument()
		})
	})
})

const mockAnalyzeData: AnalyzeData = {
	text: '猫が好きです',
	tokens: [
		{
			original: '猫',
			furigana: '猫[ねこ]',
			isWord: true,
			basicForm: '猫',
			dictIds: ['word1']
		},
		{original: 'が', isWord: false},
		{
			original: '好き',
			furigana: '好[す]き',
			isWord: true,
			basicForm: '好き',
			dictIds: ['word2']
		},
		{original: 'です', isWord: false}
	],
	dict: {
		word1: {
			kanji: ['猫'],
			kana: ['ねこ'],
			sense: [{pos: ['noun'], gloss: ['cat']}]
		},
		word2: {
			kanji: ['好き'],
			kana: ['すき'],
			sense: [{pos: ['adjective'], gloss: ['likeable', 'favorite']}]
		}
	}
}
