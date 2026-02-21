import type {PDFDocumentProxy} from 'pdfjs-dist/types/src/display/api'
import {forwardRef, useImperativeHandle, useRef, type Ref} from 'react'
import {useLoadPage} from '../../hooks/useLoadPage.hook'

interface Props {
	pageNumber: number
	document: PDFDocumentProxy
}

export interface PageApi {
	getPageImage: () => string | undefined
}

export const PdfPage = forwardRef(function PdfPage(
	{pageNumber, document}: Props,
	ref: Ref<PageApi>
) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const {status, error} = useLoadPage({document, pageNumber, canvasRef})

	useImperativeHandle(ref, () => ({
		getPageImage: () => canvasRef.current?.toDataURL('image/png')
	}))

	return (
		<div>
			{status === 'loading' && <p>Loading page...</p>}
			{status === 'error' && <p>{error?.message}</p>}
			<canvas ref={canvasRef} />
		</div>
	)
})
