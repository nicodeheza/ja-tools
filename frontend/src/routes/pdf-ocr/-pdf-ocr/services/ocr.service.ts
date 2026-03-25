import {useEffect, useRef, useState} from 'react'
import {ocrInit, detect as detectInfra} from '../infrastructure/ocr.infrastructure'
import type {AsyncData, IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'
import type {AnalyzedOcrResult, OcrResult} from '../pdfOcr.types'
import {getBulkTextAnalyzedRes} from '../../../../api/analyze.api'
import type {Dict} from '../../../../types/analyzedText.types'

type UseLoadOcrReturn = Omit<AsyncData<undefined>, 'data'>

export function useLoadOcr(): UseLoadOcrReturn {
	const [asyncData, setAsyncData] = useState<UseLoadOcrReturn>(getLoadingState())
	const initialized = useRef(false)

	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true
			ocrInit()
				.then(() => setAsyncData(getSuccessState(undefined)))
				.catch((err: unknown) => {
					const error = err instanceof Error ? err : new Error('Failed to initialize OCR')
					setAsyncData(getErrorState(error))
				})
		}
	}, [])

	return asyncData
}

type OcrPages = Record<number, AnalyzedOcrResult['data']>
type UseOcrDetectReturn = {
	detect: (dataUrl: string, page: number) => void
	dict: Dict
} & IdleAsyncData<OcrPages>

export function useOcrDetect(): UseOcrDetectReturn {
	const [asyncData, setAsyncData] = useState<IdleAsyncData<OcrPages>>({
		status: 'idle',
		data: undefined,
		error: undefined
	})
	const [dict, setDict] = useState<Dict>({})

	const detect = async (dataUrl: string, page: number) => {
		setAsyncData(getLoadingState())

		try {
			const ocrData = await detectInfra(dataUrl)
			const {data, dict: resDict} = await analyzeOcrResult(ocrData)

			setAsyncData(getSuccessState({...asyncData.data, [page]: data}))
			setDict({...dict, ...resDict})
		} catch (err) {
			const error = err instanceof Error ? err : new Error('OCR detection failed')
			setAsyncData(getErrorState(error))
		}
	}

	return {detect, dict, ...asyncData}
}

async function analyzeOcrResult(ocrResults: OcrResult[]): Promise<AnalyzedOcrResult> {
	const texts = ocrResults.map((r) => r.text)
	const {dict, result} = await getBulkTextAnalyzedRes(texts)
	const data = ocrResults.map((r, i) => ({
		tokens: result[i],
		box: r.box
	}))

	return {data, dict}
}
