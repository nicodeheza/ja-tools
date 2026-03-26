import {create} from 'zustand/react'
import type {PdfData} from '../pdfOcr.types'

interface PdfStore {
	file: File | undefined
	currentPage: number
	pdfData: PdfData | undefined
	setFile: (file: File) => void
	setCurrentPage: (page: number) => void
	setPdfData: (data: PdfData) => void
}

export const usePdfStore = create<PdfStore>((set) => ({
	file: undefined,
	currentPage: 1,
	pdfData: undefined,
	setFile: (file) => set({file, currentPage: 1, pdfData: undefined}),
	setCurrentPage: (page) => set({currentPage: page}),
	setPdfData: (data) => set({pdfData: data})
}))

export function resetStore() {
	usePdfStore.setState({file: undefined, currentPage: 1, pdfData: undefined})
}
