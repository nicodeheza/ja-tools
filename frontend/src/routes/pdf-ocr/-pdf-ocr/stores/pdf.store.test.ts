import {describe, expect, it, vi, afterEach} from 'vitest'
import * as pdfStorage from './pdf.storage'
import {usePdfStore, resetStore} from './pdf.store'

// Mock pdf.storage — the factory ensures loadFile resolves to undefined by default.
vi.mock('./pdf.storage', () => ({
	loadFile: vi.fn().mockResolvedValue(undefined),
	saveFile: vi.fn().mockResolvedValue(undefined),
	clearFile: vi.fn().mockResolvedValue(undefined),
	saveCurrentPage: vi.fn(),
	loadCurrentPage: vi.fn().mockReturnValue(1)
}))

afterEach(() => {
	vi.clearAllMocks()
	resetStore()
	vi.mocked(pdfStorage.loadFile).mockResolvedValue(undefined)
})

describe('setFile', () => {
	it('should call saveFile with the file when setFile is called', () => {
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		usePdfStore.getState().setFile(file)

		expect(pdfStorage.saveFile).toHaveBeenCalledWith(file)
	})

	it('should update file in the store when setFile is called', () => {
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		usePdfStore.getState().setFile(file)

		expect(usePdfStore.getState().file).toBe(file)
	})

	it('should call saveFile with the new file when setFile is called again', () => {
		const first = new File(['pdf'], 'first.pdf', {type: 'application/pdf'})
		const second = new File(['pdf'], 'second.pdf', {type: 'application/pdf'})

		usePdfStore.getState().setFile(first)
		usePdfStore.getState().setFile(second)

		expect(pdfStorage.saveFile).toHaveBeenCalledTimes(2)
		expect(pdfStorage.saveFile).toHaveBeenLastCalledWith(second)
	})

	it('should reset currentPage and pdfData when setFile is called', () => {
		usePdfStore.setState({currentPage: 5, pdfData: {totalPages: 10, name: 'old.pdf'}})

		usePdfStore.getState().setFile(new File(['pdf'], 'new.pdf', {type: 'application/pdf'}))

		expect(usePdfStore.getState().currentPage).toBe(1)
		expect(usePdfStore.getState().pdfData).toBeUndefined()
	})

	it('should call saveCurrentPage with 1 when setFile is called', () => {
		usePdfStore.getState().setFile(new File(['pdf'], 'test.pdf', {type: 'application/pdf'}))

		expect(pdfStorage.saveCurrentPage).toHaveBeenCalledWith(1)
	})
})

describe('setCurrentPage', () => {
	it('should update currentPage in the store', () => {
		usePdfStore.getState().setCurrentPage(5)

		expect(usePdfStore.getState().currentPage).toBe(5)
	})

	it('should call saveCurrentPage with the new page', () => {
		usePdfStore.getState().setCurrentPage(3)

		expect(pdfStorage.saveCurrentPage).toHaveBeenCalledWith(3)
	})
})

describe('restoreFile', () => {
	it('should set file and currentPage in the store', () => {
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		usePdfStore.getState().restoreFile(file, 4)

		expect(usePdfStore.getState().file).toBe(file)
		expect(usePdfStore.getState().currentPage).toBe(4)
	})

	it('should not call saveFile or saveCurrentPage', () => {
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		usePdfStore.getState().restoreFile(file, 2)

		expect(pdfStorage.saveFile).not.toHaveBeenCalled()
		expect(pdfStorage.saveCurrentPage).not.toHaveBeenCalled()
	})
})

describe('resetStore', () => {
	it('should reset file, currentPage and pdfData', () => {
		usePdfStore.setState({
			file: new File(['pdf'], 'test.pdf', {type: 'application/pdf'}),
			currentPage: 5,
			pdfData: {totalPages: 10, name: 'test.pdf'}
		})

		resetStore()

		expect(usePdfStore.getState().file).toBeUndefined()
		expect(usePdfStore.getState().currentPage).toBe(1)
		expect(usePdfStore.getState().pdfData).toBeUndefined()
	})
})
