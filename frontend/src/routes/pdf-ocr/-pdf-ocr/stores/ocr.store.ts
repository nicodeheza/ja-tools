import {create} from 'zustand/react'
import type {AnalyzedOcrResult, OcrPages} from '../pdfOcr.types'
import type {Dict} from '../../../../types/analyzedText.types'

interface OcrStore {
	ocrData: OcrPages
	dict: Dict
	setOcrPage: (page: number, data: AnalyzedOcrResult['data'], dict: Dict) => void
}

export const useOcrStore = create<OcrStore>((set, get) => ({
	ocrData: {},
	dict: {},
	setOcrPage: (page, data, dict) => {
		set({
			ocrData: {...get().ocrData, [page]: data},
			dict: {...get().dict, ...dict}
		})
	}
}))

export function resetOcrStore() {
	useOcrStore.setState({ocrData: {}, dict: {}})
}
