import {useRef, useCallback, type FC} from 'react'
import {PdfBar} from './components/pdf-bar/PdfBar.component'
import {PdfPage, type PageApi} from './components/pdf-page/PdfPage.component'
import {
	useLoadPdf,
	useFile,
	useCurrentPage,
	useStoreHydration
} from './services/pdf.service'
import {useLoadOcr, useOcrDetect} from './services/ocr.service'
import styles from './PdfOcr.module.css'
import {useZoom} from './hooks/useZoom.hook'
import {FuriganaSettings} from '../../../components/settings/FuriganaSettings.component'

export const PdfOcr: FC = () => {
	const pageRef = useRef<PageApi>(null)
	const {file, setFile} = useFile()
	const {currentPage, setCurrentPage} = useCurrentPage()

	const {
		loadPdf,
		data: loadPdfData,
		status: loadPdfStatus,
		error: loadPdfError
	} = useLoadPdf()

	const {status: ocrLoadStatus, error: ocrLoadingError} = useLoadOcr()
	const {detect, status: ocrStatus, data: ocrData, dict} = useOcrDetect()
	const {isHydrating: isStoreLoading, error: storeError} = useStoreHydration()
	const {zoom} = useZoom()

	const handleFileSelected = useCallback(
		(file: File) => {
			setFile(file)
			loadPdf(file)
		},
		[setFile, loadPdf]
	)

	const handleOcr = () => {
		const image = pageRef.current?.getPageImage()
		if (!image) return
		detect(image, currentPage)
	}

	if (ocrLoadStatus === 'error' || storeError)
		return <p>{ocrLoadingError?.message || storeError?.message}</p>
	if (ocrLoadStatus === 'loading' || isStoreLoading) return <p>Loading...</p>

	return (
		<div className={styles.page}>
			<div className={styles.settings}>
				<FuriganaSettings />
			</div>
			<PdfBar
				file={file}
				onFileSelected={handleFileSelected}
				currentPage={currentPage}
				totalPages={loadPdfData?.totalPages}
				onPageChange={setCurrentPage}
				onOcr={handleOcr}
				ocrReady={ocrLoadStatus === 'success'}
				ocrLoading={ocrStatus === 'loading'}
			/>
			<div className={styles.viewport}>
				{(() => {
					switch (loadPdfStatus) {
						case 'idle':
							return <p>Please load a PDF</p>
						case 'loading':
							return <p>Loading...</p>
						case 'error':
							return <p>{loadPdfError.message}</p>
						case 'success':
							return (
								<PdfPage
									pageNumber={currentPage}
									ref={pageRef}
									ocrResults={ocrData[currentPage]}
									dict={dict}
									zoom={zoom}
								/>
							)
					}
				})()}
			</div>
		</div>
	)
}
