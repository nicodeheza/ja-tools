import {create} from 'zustand/react'
import {getTextAnalyzeRes} from '../../../api/analyze.api'
import {analyzeStorage} from './analyze.storage'
import type {AnalyzeData} from './analyze.types'
import {useEffect} from 'react'

interface BaseAnalyze {
	analyzeText: (text: string) => Promise<void>
	removeData: () => void
	updateInitialState: () => void
}

interface InactiveAnalyze {
	data: undefined
	error: undefined
	status: 'inactive'
}
interface LoadingAnalyze {
	data: undefined
	error: undefined
	status: 'loading'
}
interface ErrorAnalyze {
	data: undefined
	error: Error
	status: 'error'
}
interface SuccessAnalyze {
	data: AnalyzeData
	error: undefined
	status: 'success'
}

type AnalyzeState = InactiveAnalyze | LoadingAnalyze | ErrorAnalyze | SuccessAnalyze

type AnaliceTextStore = BaseAnalyze & AnalyzeState

const useAnalyzedTextStore = create<AnaliceTextStore>((set) => ({
	...getInitialState(),
	analyzeText: async (text: string) => {
		set({status: 'loading', data: undefined, error: undefined})
		try {
			const res = await getTextAnalyzeRes(text)
			const data = {...res, text}
			analyzeStorage.saveData(data)
			set({status: 'success', data, error: undefined})
		} catch (error) {
			set({status: 'error', data: undefined, error: error as Error})
		}
	},
	removeData: () => {
		analyzeStorage.removeData()
		set({status: 'inactive', data: undefined, error: undefined})
	},
	updateInitialState: () => {
		set(getInitialState())
	}
}))

function getInitialState(): AnalyzeState {
	const data = analyzeStorage.getData()
	if (data)
		return {
			data,
			error: undefined,
			status: 'success'
		}

	return {
		data: undefined,
		error: undefined,
		status: 'inactive'
	}
}

type AnalyzeTextService = Omit<BaseAnalyze, 'updateInitialState'> & AnalyzeState
export function useAnalyzedText(): AnalyzeTextService {
	const store = useAnalyzedTextStore((s) => s)

	useEffect(() => {
		if (store.status !== 'inactive') return
		store.updateInitialState()
		// only need this in first render
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return store
}

export function clearAnalyzedTextStore() {
	useAnalyzedTextStore.getState().removeData()
}
