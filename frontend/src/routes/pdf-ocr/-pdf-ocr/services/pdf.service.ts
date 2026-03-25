import {useEffect, useRef, useState, type RefObject} from 'react'
import {pdf} from '../infrastructure/pdf.infrastructure'
import type {AsyncData, IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getIdleState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'

interface PdfData {
	totalPages: number
	name: string
}

type UseLoadPdfReturn = {
	loadPdf: (file: File) => void
} & IdleAsyncData<PdfData>

export function useLoadPdf(): UseLoadPdfReturn {
	const [asyncData, setAsyncData] = useState<IdleAsyncData<PdfData>>(getIdleState())

	const loadPdf = (file: File) => {
		setAsyncData(getLoadingState())

		pdf
			.loadPdf(file)
			.then(() => {
				setAsyncData(
					getSuccessState<PdfData>({
						totalPages: pdf.totalPages,
						name: pdf.name
					})
				)
			})
			.catch((err: unknown) => {
				const error =
					err instanceof Error ? err : new Error('Failed to load PDF document')
				setAsyncData(getErrorState(error))
			})
	}

	return {loadPdf, ...asyncData}
}

interface UseLoadPageParams {
	pageNumber: number
	canvasRef: RefObject<HTMLCanvasElement | null>
}

type UseLoadPageReturn = Omit<AsyncData<undefined>, 'data'>

export function useLoadPage({
	pageNumber,
	canvasRef
}: UseLoadPageParams): UseLoadPageReturn {
	const [pageReturn, setPageReturn] = useState<UseLoadPageReturn>(getLoadingState())
	const rendering = useRef<Set<number>>(new Set())

	useEffect(() => {
		if (!canvasRef.current) {
			return
		}
		setPageReturn(getLoadingState())

		const canvas = canvasRef.current

		const renderPage = async () => {
			try {
				await pdf.renderPage(canvas, pageNumber)
				setPageReturn(getSuccessState<undefined>(undefined))
			} catch (err) {
				if (err instanceof Error && err.name === 'RenderingCancelledException') return

				const error = err instanceof Error ? err : new Error('Failed to render PDF page')
				setPageReturn(getErrorState(error))
			}
		}

		if (rendering.current.has(pageNumber)) return
		rendering.current.add(pageNumber)
		renderPage().finally(() => rendering.current.delete(pageNumber))
	}, [pageNumber, canvasRef])

	return pageReturn
}
