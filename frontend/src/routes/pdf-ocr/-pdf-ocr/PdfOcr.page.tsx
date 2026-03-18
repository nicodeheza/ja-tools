import {useRef, useState, useCallback, type FC} from 'react'
import {PdfBar} from './components/pdf-bar/PdfBar.component'
import {PdfPage, type PageApi} from './components/pdf-page/PdfPage.component'
import {useLoadPdf} from './services/pdf.service'
import {useLoadOcr, useOcrDetect} from './services/ocr.service'

//TODO - persist file on navigation
export const PdfOcr: FC = () => {
	const pageRef = useRef<PageApi>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [file, setFile] = useState<File | undefined>()

	const {
		loadPdf,
		data: loadPdfData,
		status: loadPdfStatus,
		error: loadPdfError
	} = useLoadPdf()

	const {status: ocrLoadStatus, error: ocrLoadingError} = useLoadOcr()
	const {detect, status: ocrStatus, data: ocrData} = useOcrDetect()

	const handleFileSelected = useCallback(
		(file: File) => {
			setCurrentPage(1)
			setFile(file)
			loadPdf(file)
		},
		[loadPdf]
	)

	const handleOcr = () => {
		const image = pageRef.current?.getPageImage()
		if (!image) return
		detect(image)
	}

	if (ocrLoadStatus === 'error') return <p>{ocrLoadingError?.message}</p>
	if (ocrLoadStatus === 'loading') return <p>Loading...</p>

	return (
		<div>
			<PdfBar
				file={file}
				onFileSelected={handleFileSelected}
				currentPage={currentPage}
				totalPages={loadPdfData?.totalPages}
				onPageChange={setCurrentPage}
				onOcr={handleOcr}
				ocrReady={ocrLoadStatus === 'success'}
			/>
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
								ocrResults={ocrStatus === 'success' ? ocrData : undefined}
							/>
						)
				}
			})()}
		</div>
	)
}
