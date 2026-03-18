import {forwardRef, useImperativeHandle, useRef, type Ref} from 'react'
import {useLoadPage} from '../../services/pdf.service'
import type {OcrResult} from '../../pdfOcr.types'
import styles from './PdfPage.module.css'

interface Props {
	pageNumber: number
	ocrResults?: OcrResult[]
}

export interface PageApi {
	getPageImage: () => string | undefined
}

export const PdfPage = forwardRef(function PdfPage(
	{pageNumber, ocrResults}: Props,
	ref: Ref<PageApi>
) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const {status, error} = useLoadPage({pageNumber, canvasRef})

	useImperativeHandle(ref, () => ({
		getPageImage: () => canvasRef.current?.toDataURL('image/png')
	}))

	return (
		<div className={styles.container}>
			{status === 'loading' && <p>Loading page...</p>}
			{status === 'error' && <p>{error?.message}</p>}
			<canvas ref={canvasRef} />
			{ocrResults && ocrResults.length > 0 && (
				<div className={styles.overlay}>
					{ocrResults.map((result, i) => (
						<span
							key={i}
							className={styles.ocrWord}
							style={{
								left: result.box.x,
								top: result.box.y,
								width: result.box.w,
								height: result.box.h
							}}
						>
							{result.text}
						</span>
					))}
				</div>
			)}
		</div>
	)
})
