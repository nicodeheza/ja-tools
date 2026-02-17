import {useRef, useState, type FC} from 'react'
import {PdfBar} from './components/pdf-bar/PdfBar.component'
import {PdfPage} from './components/pdf-page/PdfPage.component'

//TODO - persist file on navigation
export const PdfOcr: FC = () => {
	const pageRef = useRef<HTMLCanvasElement>(null)
	const [file, setFile] = useState<File | undefined>()
	return (
		<div>
			<PdfBar
				file={file}
				onFileSelected={setFile}
				currentPage={1}
				totalPages={100}
				onPageChange={() => {}}
				onOcr={() => {}}
			/>
			{file && <PdfPage ref={pageRef} />}
		</div>
	)
}
