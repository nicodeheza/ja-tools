import {useState, useEffect, type RefObject, useRef} from 'react'
import type {PDFDocumentProxy} from 'pdfjs-dist'
import type {AsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'

// TODO -  test

interface UseLoadPageParams {
	document: PDFDocumentProxy | undefined
	pageNumber: number
	canvasRef: RefObject<HTMLCanvasElement | null>
}

type UseLoadPageReturn = Omit<AsyncData<undefined>, 'data'>

export function useLoadPage({
	document,
	pageNumber,
	canvasRef
}: UseLoadPageParams): UseLoadPageReturn {
	const [pageReturn, setPageReturn] = useState<UseLoadPageReturn>(getLoadingState())
	const rendering = useRef<Set<number>>(new Set())

	useEffect(() => {
		if (!document || !canvasRef.current) {
			return
		}
		setPageReturn(getLoadingState())

		const canvas = canvasRef.current
		const totalPages = document.numPages
		const validPage = Math.max(1, Math.min(pageNumber, totalPages))

		const renderPage = async () => {
			try {
				const page = await document.getPage(validPage)
				const viewport = page.getViewport({scale: 2.0})

				canvas.width = viewport.width
				canvas.height = viewport.height

				const context = canvas.getContext('2d')
				if (!context) {
					throw new Error('Failed to get canvas context')
				}

				const renderTask = page.render({
					canvasContext: context,
					canvas,
					viewport: viewport
				})
				await renderTask.promise

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
	}, [document, pageNumber, canvasRef])

	return pageReturn
}
