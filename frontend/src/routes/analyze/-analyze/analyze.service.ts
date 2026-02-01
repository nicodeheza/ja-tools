import {create} from 'zustand/react'
import {getTextAnalyzeRes} from '../../../api/analyze.api'
import {analyzeStorage} from './analyze.storage'
import type {AnalyzeData} from './analyze.types'

interface BaseAnalyze {
	analyzeText: (text: string) => Promise<void>
	removeData: () => void
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
			set({status: 'success', data: {...res, text}, error: undefined})
		} catch (error) {
			set({status: 'error', data: undefined, error: error as Error})
		}
	},
	removeData: () => {
		analyzeStorage.removeData()
		set({status: 'inactive', data: undefined, error: undefined})
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

export function useAnalyzedText() {
	return useAnalyzedTextStore((state) => state)
}
