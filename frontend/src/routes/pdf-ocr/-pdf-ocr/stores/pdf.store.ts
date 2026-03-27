import {create} from 'zustand/react'
import type {PdfData} from '../pdfOcr.types'
import {saveCurrentPage, saveFile} from './pdf.storage'
import {resetOcrStore} from './ocr.store'

interface PdfStore {
	file: File | undefined
	currentPage: number
	pdfData: PdfData | undefined
	setFile: (file: File) => void
	restoreFile: (file: File, currentPage: number) => void
	setCurrentPage: (page: number) => void
	setPdfData: (data: PdfData) => void
}

export const usePdfStore = create<PdfStore>((set) => ({
	file: undefined,
	currentPage: 1,
	pdfData: undefined,
	setFile: (file) => {
		saveFile(file)
		saveCurrentPage(1)
		resetOcrStore()
		set({file, currentPage: 1, pdfData: undefined})
	},
	restoreFile: (file, currentPage) => set({file, currentPage}),
	setCurrentPage: (page) => {
		set({currentPage: page})
		saveCurrentPage(page)
	},
	setPdfData: (data) => set({pdfData: data})
}))

export function resetStore() {
	usePdfStore.setState({file: undefined, currentPage: 1, pdfData: undefined})
}
