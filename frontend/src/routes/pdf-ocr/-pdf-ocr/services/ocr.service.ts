import {useEffect, useRef, useState} from 'react'
import {ocrInit, detect as detectInfra} from '../infrastructure/ocr.infrastructure'
import type {AsyncData, IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'
import type {AnalyzedOcrResult, OcrPages, OcrResult} from '../pdfOcr.types'
import {getBulkTextAnalyzedRes} from '../../../../api/analyze.api'
import type {Dict} from '../../../../types/analyzedText.types'
import {useOcrStore} from '../stores/ocr.store'

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

type UseOcrDetectReturn = {
	detect: (dataUrl: string, page: number) => void
	dict: Dict
	data: OcrPages
} & Omit<IdleAsyncData<undefined>, 'data'>

export function useOcrDetect(): UseOcrDetectReturn {
	const {ocrData, dict, setOcrPage} = useOcrStore()
	const [asyncData, setAsyncData] = useState<IdleAsyncData<undefined>>({
		status: 'idle',
		data: undefined,
		error: undefined
	})

	const detect = async (dataUrl: string, page: number) => {
		setAsyncData(getLoadingState())

		try {
			const ocrData = await detectInfra(dataUrl)
			const {data, dict: resDict} = await analyzeOcrResult(ocrData)

			setOcrPage(page, data, resDict)
			setAsyncData(getSuccessState(undefined))
		} catch (err) {
			const error = err instanceof Error ? err : new Error('OCR detection failed')
			setAsyncData(getErrorState(error))
		}
	}

	return {detect, dict, ...asyncData, data: ocrData}
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
