import {useEffect, useRef, useState, useCallback, type RefObject} from 'react'
import {useShallow} from 'zustand/react/shallow'
import {pdf} from '../infrastructure/pdf.infrastructure'
import type {AsyncData, IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getIdleState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'
import {usePdfStore} from './pdf.store'
import type {PdfData} from '../pdfOcr.types'
import {loadFile} from './pdf.storage'

export {resetStore} from './pdf.store'

export function useFile() {
	return usePdfStore(useShallow((s) => ({file: s.file, setFile: s.setFile})))
}

export function useStoreHydration() {
	const [isHydrating, setIsHydrating] = useState(true)
	const [error, setError] = useState<Error | undefined>(undefined)
	const {setFile} = useFile()

	useEffect(() => {
		loadFile()
			.then((file) => {
				if (file) setFile(file)
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err : new Error('Failed to restore file from storage'))
			})
			.finally(() => {
				setIsHydrating(false)
			})
		// Intentionally runs only on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return {isHydrating, error}
}

export function useCurrentPage() {
	return usePdfStore(
		useShallow((s) => ({currentPage: s.currentPage, setCurrentPage: s.setCurrentPage}))
	)
}

type UseLoadPdfReturn = {loadPdf: (file: File) => void} & IdleAsyncData<PdfData>

export function useLoadPdf(): UseLoadPdfReturn {
	const {file, pdfData, setPdfData} = usePdfStore(
		useShallow((s) => ({file: s.file, pdfData: s.pdfData, setPdfData: s.setPdfData}))
	)

	const [asyncState, setAsyncState] = useState<IdleAsyncData<PdfData>>(
		pdfData ? getSuccessState(pdfData) : getIdleState()
	)

	const loadPdf = useCallback(
		(file: File) => {
			setAsyncState(getLoadingState())

			pdf
				.loadPdf(file)
				.then(() => {
					const data: PdfData = {totalPages: pdf.totalPages, name: pdf.name}
					setPdfData(data)
					setAsyncState(getSuccessState(data))
				})
				.catch((err: unknown) => {
					const error =
						err instanceof Error ? err : new Error('Failed to load PDF document')
					setAsyncState(getErrorState(error))
				})
		},
		[setPdfData]
	)

	useEffect(() => {
		if (file && asyncState.status === 'idle') {
			loadPdf(file)
		}
		// Runs when file changes so that a file restored from storage (set after mount
		// by useStoreHydration) also triggers the auto-load. The ref guard ensures it
		// only fires once — subsequent loads are driven by explicit user actions.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [file])

	return {loadPdf, ...asyncState}
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
