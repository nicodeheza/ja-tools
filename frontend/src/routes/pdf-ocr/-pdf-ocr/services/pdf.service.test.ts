import {describe, expect, it, vi, afterEach} from 'vitest'
import {renderHook, act, waitFor} from '@testing-library/react'
import {useLoadPdf, useFile, useCurrentPage, useStoreHydration, resetStore} from './pdf.service'
import * as pdfStorage from './pdf.storage'

// vi.hoisted ensures mockPdf is available before the hoisted vi.mock call
const mockPdf = vi.hoisted(() => ({
	loadPdf: vi.fn(),
	renderPage: vi.fn(),
	totalPages: 0,
	name: ''
}))

vi.mock('../infrastructure/pdf.infrastructure.js', () => ({
	pdf: mockPdf
}))

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
	// Restore default: loadFile resolves to undefined (no stored file)
	vi.mocked(pdfStorage.loadFile).mockResolvedValue(undefined)
})

describe('useLoadPdf', () => {
	it('should have idle status initially', () => {
		const {result} = renderHook(() => useLoadPdf())

		expect(result.current.status).toBe('idle')
		expect(result.current.data).toBeUndefined()
		expect(result.current.error).toBeUndefined()
	})

	it('should transition to loading when loadPdf is called', () => {
		mockPdf.loadPdf.mockReturnValue(new Promise(() => {}))

		const {result} = renderHook(() => useLoadPdf())

		act(() => {
			result.current.loadPdf(new File(['pdf'], 'test.pdf', {type: 'application/pdf'}))
		})

		expect(result.current.status).toBe('loading')
		expect(result.current.data).toBeUndefined()
		expect(result.current.error).toBeUndefined()
	})

	it('should transition to success with correct data when loadPdf resolves', async () => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		mockPdf.totalPages = 5
		mockPdf.name = 'document.pdf'

		const {result} = renderHook(() => useLoadPdf())

		act(() => {
			result.current.loadPdf(new File(['pdf'], 'document.pdf', {type: 'application/pdf'}))
		})

		await waitFor(() => {
			expect(result.current.status).toBe('success')
		})

		expect(result.current.data).toEqual({totalPages: 5, name: 'document.pdf'})
		expect(result.current.error).toBeUndefined()
	})

	it('should transition to error when loadPdf rejects with an Error', async () => {
		const loadError = new Error('Failed to parse PDF')
		mockPdf.loadPdf.mockRejectedValue(loadError)

		const {result} = renderHook(() => useLoadPdf())

		act(() => {
			result.current.loadPdf(new File(['bad'], 'bad.pdf', {type: 'application/pdf'}))
		})

		await waitFor(() => {
			expect(result.current.status).toBe('error')
		})

		expect(result.current.error).toBe(loadError)
		expect(result.current.data).toBeUndefined()
	})

	it('should wrap non-Error rejections in a generic Error', async () => {
		mockPdf.loadPdf.mockRejectedValue('something went wrong')

		const {result} = renderHook(() => useLoadPdf())

		act(() => {
			result.current.loadPdf(new File(['bad'], 'bad.pdf', {type: 'application/pdf'}))
		})

		await waitFor(() => {
			expect(result.current.status).toBe('error')
		})

		expect(result.current.error).toBeInstanceOf(Error)
		expect(result.current.error?.message).toBe('Failed to load PDF document')
	})

	it('should hydrate to success on mount when pdfData is already in the store', async () => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		mockPdf.totalPages = 3
		mockPdf.name = 'shared.pdf'

		// First mount: load the PDF to populate pdfData in the store
		const {result: first, unmount} = renderHook(() => useLoadPdf())
		act(() => {
			first.current.loadPdf(new File(['pdf'], 'shared.pdf', {type: 'application/pdf'}))
		})
		await waitFor(() => expect(first.current.status).toBe('success'))
		expect(first.current.data).toEqual({totalPages: 3, name: 'shared.pdf'})
		expect(mockPdf.loadPdf).toHaveBeenCalled()

		unmount()

		// Second mount (simulates navigation away and back): hydrates directly to success
		// from pdfData in the store — no extra loadPdf call needed
		mockPdf.loadPdf.mockClear()
		const {result: second} = renderHook(() => useLoadPdf())
		expect(second.current.status).toBe('success')
		expect(second.current.data).toEqual({totalPages: 3, name: 'shared.pdf'})
		expect(mockPdf.loadPdf).not.toHaveBeenCalled()
	})

	it('should auto-load PDF on mount when file is in the store but pdfData is not', async () => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		mockPdf.totalPages = 4
		mockPdf.name = 'auto.pdf'

		const file = new File(['pdf'], 'auto.pdf', {type: 'application/pdf'})

		// Seed the store with a file (but pdfData stays undefined since this is a fresh store)
		const {result: fileHook} = renderHook(() => useFile())
		act(() => {
			fileHook.current.setFile(file)
		})

		// Mount useLoadPdf — the mount effect sees file in store and idle status, triggers load
		const {result} = renderHook(() => useLoadPdf())

		await waitFor(() => {
			expect(mockPdf.loadPdf).toHaveBeenCalledWith(file)
		})
		await waitFor(() => expect(result.current.status).toBe('success'))
	})

	it('should reset store state after resetStore is called', async () => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		mockPdf.totalPages = 2
		mockPdf.name = 'reset.pdf'

		const file = new File(['pdf'], 'reset.pdf', {type: 'application/pdf'})
		const {result: fileHook} = renderHook(() => useFile())
		const {result: pageHook} = renderHook(() => useCurrentPage())

		act(() => {
			fileHook.current.setFile(file)
		})
		act(() => {
			pageHook.current.setCurrentPage(5)
		})

		act(() => {
			resetStore()
		})

		expect(fileHook.current.file).toBeUndefined()
		expect(pageHook.current.currentPage).toBe(1)
	})
})

describe('useFile', () => {
	it('should have undefined file initially', () => {
		const {result} = renderHook(() => useFile())

		expect(result.current.file).toBeUndefined()
	})

	it('should update file when setFile is called', () => {
		const {result} = renderHook(() => useFile())
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		act(() => {
			result.current.setFile(file)
		})

		expect(result.current.file).toBe(file)
	})

	it('should reset file to undefined after resetStore is called', () => {
		const {result} = renderHook(() => useFile())
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		act(() => {
			result.current.setFile(file)
		})
		expect(result.current.file).toBe(file)

		act(() => {
			resetStore()
		})

		expect(result.current.file).toBeUndefined()
	})

	it('should trigger loadPdf on next useLoadPdf mount when setFile is called', async () => {
		mockPdf.loadPdf.mockResolvedValue(undefined)
		const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})

		// Set the file in the store first
		const {result: fileHook} = renderHook(() => useFile())
		act(() => {
			fileHook.current.setFile(file)
		})

		// Mounting useLoadPdf with a file in store and idle status triggers auto-load
		renderHook(() => useLoadPdf())

		await waitFor(() => {
			expect(mockPdf.loadPdf).toHaveBeenCalledWith(file)
		})
	})
})

describe('useCurrentPage', () => {
	it('should have currentPage of 1 initially', () => {
		const {result} = renderHook(() => useCurrentPage())

		expect(result.current.currentPage).toBe(1)
	})

	it('should update currentPage when setCurrentPage is called', () => {
		const {result} = renderHook(() => useCurrentPage())

		act(() => {
			result.current.setCurrentPage(3)
		})

		expect(result.current.currentPage).toBe(3)
	})

	it('should reset currentPage to 1 when setFile is called', () => {
		const {result: pageResult} = renderHook(() => useCurrentPage())
		const {result: fileResult} = renderHook(() => useFile())

		act(() => {
			pageResult.current.setCurrentPage(5)
		})
		expect(pageResult.current.currentPage).toBe(5)

		act(() => {
			fileResult.current.setFile(new File(['pdf'], 'new.pdf', {type: 'application/pdf'}))
		})

		expect(pageResult.current.currentPage).toBe(1)
	})

	it('should reset currentPage to 1 after resetStore is called', () => {
		const {result} = renderHook(() => useCurrentPage())

		act(() => {
			result.current.setCurrentPage(4)
		})
		expect(result.current.currentPage).toBe(4)

		act(() => {
			resetStore()
		})

		expect(result.current.currentPage).toBe(1)
	})
})

describe('useStoreHydration', () => {
	it('should have isHydrating true and no error initially', () => {
		const {result} = renderHook(() => useStoreHydration())

		expect(result.current.isHydrating).toBe(true)
		expect(result.current.error).toBeUndefined()
	})

	it('should become isHydrating false with no error after loadFile resolves with no file', async () => {
		vi.mocked(pdfStorage.loadFile).mockResolvedValue(undefined)

		const {result} = renderHook(() => useStoreHydration())
		expect(result.current.isHydrating).toBe(true)

		await waitFor(() => {
			expect(result.current.isHydrating).toBe(false)
		})

		expect(result.current.error).toBeUndefined()
	})

	it('should set the file in the store and become isHydrating false when loadFile resolves with a file', async () => {
		const storedFile = new File(['pdf'], 'stored.pdf', {type: 'application/pdf'})
		vi.mocked(pdfStorage.saveFile).mockResolvedValue(undefined)
		vi.mocked(pdfStorage.loadFile).mockResolvedValue(storedFile)

		const {result: hydrating} = renderHook(() => useStoreHydration())
		const {result: fileHook} = renderHook(() => useFile())

		expect(hydrating.current.isHydrating).toBe(true)

		await waitFor(() => {
			expect(hydrating.current.isHydrating).toBe(false)
		})

		expect(hydrating.current.error).toBeUndefined()
		expect(fileHook.current.file).toBe(storedFile)
	})

	it('should set error and become isHydrating false when loadFile rejects', async () => {
		const storageError = new Error('IndexedDB error')
		vi.mocked(pdfStorage.loadFile).mockRejectedValue(storageError)

		const {result} = renderHook(() => useStoreHydration())
		expect(result.current.isHydrating).toBe(true)

		await waitFor(() => {
			expect(result.current.isHydrating).toBe(false)
		})

		expect(result.current.error).toBe(storageError)
	})

	it('should wrap non-Error rejections in a generic Error', async () => {
		vi.mocked(pdfStorage.loadFile).mockRejectedValue('storage failed')

		const {result} = renderHook(() => useStoreHydration())

		await waitFor(() => {
			expect(result.current.isHydrating).toBe(false)
		})

		expect(result.current.error).toBeInstanceOf(Error)
		expect(result.current.error?.message).toBe('Failed to restore file from storage')
	})

	it('should not call saveFile when loading from storage', async () => {
		const storedFile = new File(['pdf'], 'stored.pdf', {type: 'application/pdf'})
		vi.mocked(pdfStorage.loadFile).mockResolvedValue(storedFile)
		vi.mocked(pdfStorage.saveFile).mockResolvedValue(undefined)

		renderHook(() => useStoreHydration())

		await waitFor(() => {
			expect(pdfStorage.saveFile).not.toHaveBeenCalled()
		})
	})
})
