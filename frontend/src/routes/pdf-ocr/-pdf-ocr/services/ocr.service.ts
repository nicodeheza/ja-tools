import {useEffect, useRef, useState} from 'react'
import {ocrInit, detect as detectInfra} from '../infrastructure/ocr.infrastructure'
import type {AsyncData, IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'
import type {OcrResult} from '../pdfOcr.types'

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
	detect: (dataUrl: string) => void
} & IdleAsyncData<OcrResult[]>

export function useOcrDetect(): UseOcrDetectReturn {
	const [asyncData, setAsyncData] = useState<IdleAsyncData<OcrResult[]>>({
		status: 'idle',
		data: undefined,
		error: undefined
	})

	const detect = (dataUrl: string) => {
		setAsyncData(getLoadingState())

		detectInfra(dataUrl)
			.then((results) => {
				setAsyncData(getSuccessState(results))
			})
			.catch((err: unknown) => {
				const error = err instanceof Error ? err : new Error('OCR detection failed')
				setAsyncData(getErrorState(error))
			})
	}

	return {detect, ...asyncData}
}
