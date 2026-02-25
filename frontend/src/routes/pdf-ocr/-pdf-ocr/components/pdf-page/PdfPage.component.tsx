import {forwardRef, useImperativeHandle, useRef, type Ref} from 'react'
import {useLoadPage} from '../../services/pdf.service'

interface Props {
	pageNumber: number
}

export interface PageApi {
	getPageImage: () => string | undefined
}

export const PdfPage = forwardRef(function PdfPage(
	{pageNumber}: Props,
	ref: Ref<PageApi>
) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const {status, error} = useLoadPage({pageNumber, canvasRef})

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
