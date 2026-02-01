import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest'
import {render, waitFor, screen, cleanup, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {TextGenerator} from './TextGenerator.view'
import * as generatorApi from '../../../api/generator.api'
import {GeneratedTextStorage} from './TextGenerator.storage'
import type {EventData, Paragraph} from './TextGenerator.types'
import type {Dict} from '../../../types/analyzedText.types'

vi.mock('../../../api/generator.api')
vi.mock('./TextGenerator.storage')

describe('Text Generator', () => {
	const mockEventSource: EventSource = {
		onerror: null,
		onmessage: null,
		onopen: null,
		readyState: 0,
		url: '',
		withCredentials: false,
		close: vi.fn(),
		CONNECTING: 0,
		OPEN: 1,
		CLOSED: 2,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}
	beforeEach(() => {
		vi.mocked(generatorApi.generateEvent).mockReturnValue(mockEventSource)

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue(undefined)
		vi.mocked(GeneratedTextStorage.saveData).mockImplementation(() => {})
	})
	afterEach(() => {
		cleanup()
		vi.clearAllMocks()
	})

	it('renders the prompt form', () => {
		render(<TextGenerator />)

		expect(
			screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		).toBeInTheDocument()
		expect(screen.getByRole('button', {name: 'Generate new text'})).toBeInTheDocument()
	})

	it('loads cached data on mount', () => {
		const mockParagraphs: Paragraph[] = [
			{
				text: '猫が好きです',
				translation: 'I like cats',
				tokens: [
					{
						original: '猫',
						furigana: 'ねこ',
						isWord: true,
						basicForm: '猫',
						mecabPos: '名詞',
						dictIds: ['word1']
					},
					{original: 'が', isWord: false},
					{
						original: '好き',
						furigana: 'すき',
						isWord: true,
						basicForm: '好き',
						mecabPos: '形容動詞',
						dictIds: ['word2']
					},
					{original: 'です', isWord: false}
				]
			}
		]
		const mockDict: Dict = {
			word1: {
				kanji: ['猫'],
				kana: ['ねこ'],
				sense: [{pos: ['noun'], gloss: ['cat']}]
			}
		}
		const mockPrompt = 'Write a story about a cat'

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue({
			paragraphs: mockParagraphs,
			dict: mockDict,
			prompt: mockPrompt
		})

		render(<TextGenerator />)

		expect(
			screen.getByText((_content, element) => {
				return element?.textContent === 'ねこがすきです'
			})
		).toBeInTheDocument()
		expect(screen.getByRole('button', {name: 'Show Translation'})).toBeInTheDocument()
		expect(screen.getByDisplayValue(mockPrompt)).toBeInTheDocument()
	})

	it('displays furigana correctly for Japanese text', () => {
		const mockParagraphs: Paragraph[] = [
			{
				text: '東京に行きました',
				translation: 'I went to Tokyo',
				tokens: [
					{
						original: '東京',
						furigana: '東京[とうきょう]',
						isWord: true,
						basicForm: '東京',
						mecabPos: '名詞',
						dictIds: ['word1']
					},
					{original: 'に', isWord: false},
					{
						original: '行',
						furigana: '行[い]きました',
						isWord: true,
						basicForm: '行く',
						mecabPos: '動詞',
						dictIds: ['word2']
					}
				]
			}
		]
		const mockDict: Dict = {
			word1: {
				kanji: ['東京'],
				kana: ['とうきょう'],
				sense: [{pos: ['noun'], gloss: ['Tokyo']}]
			},
			word2: {
				kanji: ['行く'],
				kana: ['いく'],
				sense: [{pos: ['verb'], gloss: ['to go']}]
			}
		}

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue({
			paragraphs: mockParagraphs,
			dict: mockDict,
			prompt: 'Test prompt'
		})

		render(<TextGenerator />)

		// Check that furigana readings are present (inside <rt> tags)
		expect(screen.getByText('とうきょう')).toBeInTheDocument()
		expect(screen.getByText('い')).toBeInTheDocument()

		// Check that ruby elements are present with correct content
		const tokyoRuby = screen
			.getAllByText((_content, element) => {
				return element?.textContent === '東京とうきょう'
			})
			.find((el) => el.tagName === 'RUBY')

		expect(tokyoRuby).toBeInTheDocument()

		const verbRuby = screen
			.getAllByText((_content, element) => {
				return element?.textContent === '行いきました'
			})
			.find((el) => el.tagName === 'RUBY')

		expect(verbRuby).toBeInTheDocument()
	})

	it('shows translation when Show Translation button is clicked', async () => {
		const user = userEvent.setup()
		const mockParagraphs: Paragraph[] = [
			{
				text: '猫が好きです',
				translation: 'I like cats',
				tokens: [
					{
						original: '猫',
						furigana: '猫[ねこ]',
						isWord: true,
						basicForm: '猫',
						mecabPos: '名詞',
						dictIds: ['word1']
					},
					{original: 'が', isWord: false},
					{
						original: '好き',
						furigana: '好[す]き',
						isWord: true,
						basicForm: '好き',
						mecabPos: '形容動詞',
						dictIds: ['word2']
					},
					{original: 'です', isWord: false}
				]
			}
		]
		const mockDict: Dict = {
			word1: {
				kanji: ['猫'],
				kana: ['ねこ'],
				sense: [{pos: ['noun'], gloss: ['cat']}]
			}
		}

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue({
			paragraphs: mockParagraphs,
			dict: mockDict,
			prompt: 'Test prompt'
		})

		render(<TextGenerator />)

		// Translation should not be visible initially
		expect(screen.queryByText('I like cats')).not.toBeInTheDocument()

		// Click Show Translation button
		const showButton = screen.getByRole('button', {name: 'Show Translation'})
		await user.click(showButton)

		// Translation should now be visible
		expect(screen.getByText('I like cats')).toBeInTheDocument()

		// Button text should change to Hide Translation
		const hideButton = screen.getByRole('button', {name: 'Hide Translation'})
		expect(hideButton).toBeInTheDocument()
		expect(
			screen.queryByRole('button', {name: 'Show Translation'})
		).not.toBeInTheDocument()
		await user.click(hideButton)

		expect(screen.queryByText('I like cats')).not.toBeInTheDocument()
	})

	it('hides translation when Hide Translation button is clicked', async () => {
		const user = userEvent.setup()
		const mockParagraphs: Paragraph[] = [
			{
				text: '猫が好きです',
				translation: 'I like cats',
				tokens: [
					{
						original: '猫',
						furigana: '猫[ねこ]',
						isWord: true,
						basicForm: '猫',
						mecabPos: '名詞',
						dictIds: ['word1']
					},
					{original: 'が', isWord: false},
					{
						original: '好き',
						furigana: '好[す]き',
						isWord: true,
						basicForm: '好き',
						mecabPos: '形容動詞',
						dictIds: ['word2']
					},
					{original: 'です', isWord: false}
				]
			}
		]
		const mockDict: Dict = {
			word1: {
				kanji: ['猫'],
				kana: ['ねこ'],
				sense: [{pos: ['noun'], gloss: ['cat']}]
			}
		}

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue({
			paragraphs: mockParagraphs,
			dict: mockDict,
			prompt: 'Test prompt'
		})

		render(<TextGenerator />)

		// Click Show Translation button
		const showButton = screen.getByRole('button', {name: 'Show Translation'})
		await user.click(showButton)

		// Translation should be visible
		expect(screen.getByText('I like cats')).toBeInTheDocument()

		// Click Hide Translation button
		const hideButton = screen.getByRole('button', {name: 'Hide Translation'})
		await user.click(hideButton)

		// Translation should be hidden again
		expect(screen.queryByText('I like cats')).not.toBeInTheDocument()

		// Button text should change back to Show Translation
		expect(screen.getByRole('button', {name: 'Show Translation'})).toBeInTheDocument()
		expect(
			screen.queryByRole('button', {name: 'Hide Translation'})
		).not.toBeInTheDocument()
	})

	it('displays dictionary information when clicking on a word', async () => {
		const user = userEvent.setup()
		const mockParagraphs: Paragraph[] = [
			{
				text: '猫が好きです',
				translation: 'I like cats',
				tokens: [
					{
						original: '猫',
						furigana: '猫[ねこ]',
						isWord: true,
						basicForm: '猫',
						mecabPos: '名詞',
						dictIds: ['word1']
					},
					{original: 'が', isWord: false},
					{
						original: '好き',
						furigana: '好[す]き',
						isWord: true,
						basicForm: '好き',
						mecabPos: '形容動詞',
						dictIds: ['word2']
					},
					{original: 'です', isWord: false}
				]
			}
		]
		const mockDict: Dict = {
			word1: {
				kanji: ['猫'],
				kana: ['ねこ'],
				sense: [{pos: ['noun'], gloss: ['cat', 'feline']}]
			},
			word2: {
				kanji: ['好き'],
				kana: ['すき'],
				sense: [{pos: ['adjective'], gloss: ['likeable', 'favorite']}]
			}
		}

		vi.mocked(GeneratedTextStorage.getData).mockReturnValue({
			paragraphs: mockParagraphs,
			dict: mockDict,
			prompt: 'Test prompt'
		})

		render(<TextGenerator />)

		const wordElement = screen.getByText('猫')
		await user.click(wordElement)

		// Dictionary popover should be displayed (as a dialog)
		await waitFor(() => {
			const dialog = screen.getByRole('dialog')
			expect(dialog).toBeInTheDocument()
		})

		// Check that dictionary information is displayed within the dialog
		const dialog = screen.getByRole('dialog')

		// Check POS (part of speech)
		expect(within(dialog).getByText('noun')).toBeInTheDocument()

		// Check gloss definitions
		expect(within(dialog).getByText('cat')).toBeInTheDocument()
		expect(within(dialog).getByText('feline')).toBeInTheDocument()
	})

	it('enables submit button when is not generating text', () => {
		render(<TextGenerator />)

		const submitButton = screen.getByRole('button', {name: 'Generate new text'})
		expect(submitButton).not.toBeDisabled()
	})

	it('disables input and button during generation', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		const submitButton = screen.getByRole('button', {name: /generate new text/i})

		await user.type(textarea, 'Test prompt')
		await user.click(submitButton)

		expect(textarea).toBeDisabled()
		expect(submitButton).toBeDisabled()
		expect(screen.getByText(/connecting/i)).toBeInTheDocument()
	})

	it('generates text and displays paragraphs on successful generation', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		const submitButton = screen.getByRole('button', {name: 'Generate new text'})

		await user.type(textarea, 'Test prompt')
		await user.click(submitButton)

		expect(vi.mocked(generatorApi.generateEvent)).toHaveBeenCalledWith('Test prompt')

		// Simulate connection opened
		mockEventSource.onopen?.({} as Event)

		await waitFor(() => {
			expect(screen.getByText(/generating text/i)).toBeInTheDocument()
		})

		// Simulate receiving a paragraph
		const paragraph: Paragraph = {
			text: '猫が好きです',
			translation: 'I like cats',
			tokens: [
				{
					original: '猫',
					furigana: 'ねこ',
					isWord: true,
					basicForm: '猫',
					mecabPos: '名詞',
					dictIds: ['word1']
				},
				{original: 'が', isWord: false},
				{
					original: '好き',
					furigana: 'すき',
					isWord: true,
					basicForm: '好き',
					mecabPos: '形容動詞',
					dictIds: ['word2']
				},
				{original: 'です', isWord: false}
			]
		}
		const dict: Dict = {
			word1: {
				kanji: ['猫'],
				kana: ['ねこ'],
				sense: [{pos: ['noun'], gloss: ['cat']}]
			}
		}
		const eventData: EventData = {
			message: undefined,
			error: undefined,
			paragraph,
			dict
		}

		mockEventSource.onmessage?.({data: JSON.stringify(eventData)} as MessageEvent)

		await waitFor(() => {
			expect(
				//get split text
				screen.getByText((_content, element) => {
					return element?.textContent === 'ねこがすきです'
				})
			).toBeInTheDocument()
			expect(screen.getByRole('button', {name: 'Show Translation'})).toBeInTheDocument()
		})

		// Simulate finished event
		const finishedEvent: EventData = {
			message: 'done',
			error: undefined,
			paragraph: undefined,
			dict: undefined
		}

		mockEventSource.onmessage?.({data: JSON.stringify(finishedEvent)} as MessageEvent)

		await waitFor(() => {
			expect(mockEventSource.close).toHaveBeenCalled()
			expect(GeneratedTextStorage.saveData).toHaveBeenCalledWith({
				paragraphs: [paragraph],
				dict,
				prompt: 'Test prompt'
			})
		})
	})

	it('displays error message when generation fails', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		const submitButton = screen.getByRole('button', {name: 'Generate new text'})

		await user.type(textarea, 'Test prompt')
		await user.click(submitButton)

		const errorEvent: EventData = {
			message: 'error',
			error: 'Something went wrong',
			paragraph: undefined,
			dict: undefined
		}

		mockEventSource.onmessage?.({data: JSON.stringify(errorEvent)} as MessageEvent)

		await waitFor(() => {
			expect(screen.getByText(/text generation has failed/i)).toBeInTheDocument()
			expect(mockEventSource.close).toHaveBeenCalled()
		})
	})

	it('handles EventSource onerror', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		const submitButton = screen.getByRole('button', {name: 'Generate new text'})

		await user.type(textarea, 'Test prompt')
		await user.click(submitButton)

		// Simulate EventSource error
		mockEventSource.onerror?.({} as Event)

		await waitFor(() => {
			expect(screen.getByText(/text generation has failed/i)).toBeInTheDocument()
			expect(mockEventSource.close).toHaveBeenCalled()
		})
	})

	it('requires prompt text before submission', async () => {
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')
		expect(textarea).toBeRequired()
	})

	it('updates prompt when user types', async () => {
		const user = userEvent.setup()
		render(<TextGenerator />)

		const textarea = screen.getByPlaceholderText('Ex: Create a story abut a cat.')

		await user.type(textarea, 'My custom prompt')

		expect(textarea).toHaveValue('My custom prompt')
	})
})
