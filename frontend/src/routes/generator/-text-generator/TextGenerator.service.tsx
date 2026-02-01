import {useCallback, useEffect, useState} from 'react'
import {
	isEventError,
	isEventFinished,
	type ConnectionState,
	type EventData,
	type Paragraph
} from './TextGenerator.types'
import {GeneratedTextStorage} from './TextGenerator.storage'
import type {Dict} from '../../../types/analyzedText.types'
import {generateEvent} from '../../../api/generator.api'

export function useGenerateText() {
	const [userPrompt, setUserPrompt] = useState('')
	const [paragraphs, setParagraphs] = useState<Paragraph[]>([])
	const [dict, setDict] = useState<Dict>({})
	const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
	const [error, setError] = useState<string>()
	const [saveCache, setSaveCache] = useState(false)

	useEffect(() => {
		if (!saveCache) return
		GeneratedTextStorage.saveData({paragraphs, dict, prompt: userPrompt})
		setSaveCache(false)
	}, [dict, paragraphs, saveCache, userPrompt])

	const setFromCache = useCallback(() => {
		const res = GeneratedTextStorage.getData()
		if (!res) return false
		setParagraphs(res.paragraphs)
		setDict(res.dict)
		setUserPrompt(res.prompt)

		return true
	}, [])

	const generateText = useCallback(() => {
		setParagraphs([])
		setDict({})
		setError(undefined)
		setConnectionState('loading')

		const event = generateEvent(userPrompt)

		event.onopen = () => {
			setConnectionState('connected')
		}

		event.onmessage = (e) => {
			const data: EventData = JSON.parse(e.data)

			if (isEventError(data)) {
				event.close()
				setConnectionState('disconnected')
				setError('Text generation has failed')
				console.error('SSE error:', data.error)
				return
			}

			if (isEventFinished(data)) {
				event.close()
				setConnectionState('disconnected')
				setSaveCache(true)
				return
			}

			setParagraphs((prev) => [...prev, data.paragraph])
			setDict((prev) => ({...prev, ...data.dict}))
		}

		event.onerror = (error) => {
			console.error('SSE error:', error)
			setError('Text generation has failed')
			setConnectionState('disconnected')
			event.close()
		}

		return () => {
			event.close()
			setConnectionState('disconnected')
		}
	}, [userPrompt])

	return {
		generateText,
		paragraphs,
		dict,
		connectionState,
		error,
		userPrompt,
		setUserPrompt,
		setFromCache
	}
}
