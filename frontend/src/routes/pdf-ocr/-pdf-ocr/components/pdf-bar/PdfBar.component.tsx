import {type ChangeEvent, type FC} from 'react'
import {FileInput} from '../../../../../components/FileInput/FileInput.component'
import {Button} from '../../../../../components/Button/Button.component'
import styles from './PdfBar.module.css'

interface Props {
	file?: File
	onFileSelected: (file: File) => void
	currentPage: number
	totalPages: number | undefined
	onPageChange: (newPage: number) => void
	onOcr: () => void
}

export const PdfBar: FC<Props> = ({
	file,
	onFileSelected,
	currentPage = 1,
	totalPages,
	onPageChange,
	onOcr
}) => {
	return (
		<div className={styles.bar}>
			<FileInput file={file} onFileChange={onFileSelected} accept={'application/pdf'}>
				Upload a PDF
			</FileInput>
			<Button disabled={!file} onClick={onOcr}>
				OCR Document
			</Button>
			<Pages
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={onPageChange}
			/>
		</div>
	)
}

type PagesProps = Pick<Props, 'currentPage' | 'totalPages' | 'onPageChange'>

const Pages: FC<PagesProps> = ({currentPage, totalPages, onPageChange}) => {
	const onPrev = () => {
		const prevPage = Math.max(currentPage - 1, 1)
		onPageChange(prevPage)
	}

	const onNext = () => {
		if (!totalPages) return
		const nextPaga = Math.min(currentPage + 1, totalPages)
		onPageChange(nextPaga)
	}

	const onPageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.value) return
		onPageChange(Number(e.target.value))
	}

	return (
		<div className={styles.pageSelect}>
			<button disabled={!totalPages} onClick={onPrev}>
				{'<'}
			</button>
			<input
				disabled={!totalPages}
				type="number"
				value={currentPage}
				onChange={onPageInputChange}
			/>
			{'/'}
			{totalPages ? totalPages : 0}
			<button disabled={!totalPages} onClick={onNext}>
				{'>'}
			</button>
		</div>
	)
}
