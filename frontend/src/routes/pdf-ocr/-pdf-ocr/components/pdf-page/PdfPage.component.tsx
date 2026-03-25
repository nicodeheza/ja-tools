import {forwardRef, useImperativeHandle, useRef, type Ref} from 'react'
import {useLoadPage} from '../../services/pdf.service'
import type {AnalyzedOcrResult} from '../../pdfOcr.types'
import styles from './PdfPage.module.css'
import type {Dict} from '../../../../../types/analyzedText.types'
import {AnalyzedText} from '../../../../../components/analyzed-text/AnalyzedText.component'

interface Props {
	pageNumber: number
	ocrResults?: AnalyzedOcrResult['data']
	dict: Dict
	zoom: number
}

export interface PageApi {
	getPageImage: () => string | undefined
}

export const PdfPage = forwardRef(function PdfPage(
	{pageNumber, ocrResults, zoom, dict}: Props,
	ref: Ref<PageApi>
) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const {status, error} = useLoadPage({pageNumber, canvasRef})

	useImperativeHandle(ref, () => ({
		getPageImage: () => canvasRef.current?.toDataURL('image/png')
	}))

	return (
		<div
			className={styles.container}
			style={{
				width: canvasRef.current?.width,
				height: canvasRef.current?.height,
				zoom
			}}
		>
			{status === 'loading' && <p>Loading page...</p>}
			{status === 'error' && <p>{error?.message}</p>}
			<canvas ref={canvasRef} />
			{ocrResults && ocrResults.length > 0 && (
				<div className={styles.overlay}>
					{ocrResults.map((result) => (
						<p
							style={{
								left: `${result.box.x}px`,
								top: `${result.box.y}px`,
								width: `${result.box.w}px`
							}}
							className={styles.line}
							key={JSON.stringify(result.box)}
						>
							<AnalyzedText tokens={result.tokens} dict={dict} />
						</p>
					))}
				</div>
			)}
		</div>
	)
})
