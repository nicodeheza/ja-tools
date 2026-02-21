import {useState} from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type {PDFDocumentProxy} from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type {IdleAsyncData} from '../../../../types/asyncData.types'
import {
	getErrorState,
	getIdleState,
	getLoadingState,
	getSuccessState
} from '../../../../helpers/async.helpers'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// TODO - test
interface PdfData {
	document: PDFDocumentProxy
	totalPages: number
}

type UseLoadPdfReturn = {
	loadPdf: (file: File) => void
} & IdleAsyncData<PdfData>

export function useLoadPdf(): UseLoadPdfReturn {
	const [asyncData, setAsyncData] = useState<IdleAsyncData<PdfData>>(getIdleState())

	const cleanDocument = () => {
		if (asyncData.status === 'success') asyncData.data.document.destroy()
		setAsyncData(getLoadingState())
	}

	const loadPdf = (file: File) => {
		cleanDocument()

		const fileReader = new FileReader()

		fileReader.onload = async function () {
			try {
				const arrayBuffer = this.result as ArrayBuffer
				const loadingTask = pdfjsLib.getDocument({data: arrayBuffer})
				const pdf = await loadingTask.promise

				setAsyncData(
					getSuccessState<PdfData>({
						document: pdf,
						totalPages: pdf.numPages
					})
				)
			} catch (err) {
				const error =
					err instanceof Error ? err : new Error('Failed to load PDF document')
				setAsyncData(getErrorState(error))
			}
		}

		fileReader.onerror = function () {
			setAsyncData(getErrorState(new Error('Failed to read PDF file')))
		}

		fileReader.readAsArrayBuffer(file)
	}

	return {loadPdf, ...asyncData}
}
