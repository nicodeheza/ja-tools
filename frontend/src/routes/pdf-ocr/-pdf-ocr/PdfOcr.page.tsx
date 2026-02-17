import {useState, type FC} from 'react'
import {PdfBar} from './components/pdf-bar/PdfBar.component'

//TODO - persist file on navigation
export const PdfOcr: FC = () => {
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
		</div>
	)
}
