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
				<svg
					className={styles.overlay}
					width={canvasRef.current?.width}
					height={canvasRef.current?.height}
					xmlns="http://www.w3.org/2000/svg"
				>
					{ocrResults.map((result, i) => (
						<g key={i}>
							<rect
								x={result.box.x}
								y={result.box.y}
								width={result.box.w}
								height={result.box.h}
								fill="rgba(255, 255, 0, 0.41)"
							/>
							<text
								x={result.box.x}
								y={result.box.y + result.box.h}
								fontSize={result.box.h}
								textLength={result.box.w}
								lengthAdjust="spacingAndGlyphs"
								fill="red"
								dominantBaseline="auto"
							>
								{result.text}
							</text>
						</g>
					))}
				</svg>
			)}
		</div>
	)
})
