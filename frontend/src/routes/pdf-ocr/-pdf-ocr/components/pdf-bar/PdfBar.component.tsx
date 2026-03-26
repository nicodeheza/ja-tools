import {useRef, useState, type ChangeEvent, type FC} from 'react'
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
	ocrReady?: boolean
	ocrLoading?: boolean
}

export const PdfBar: FC<Props> = ({
	file,
	onFileSelected,
	currentPage = 1,
	totalPages,
	onPageChange,
	onOcr,
	ocrReady = false,
	ocrLoading = false
}) => {
	return (
		<div className={styles.bar}>
			<FileInput file={file} onFileChange={onFileSelected} accept={'application/pdf'}>
				Upload a PDF
			</FileInput>
			<Button disabled={!file || !ocrReady || ocrLoading} onClick={onOcr}>
				{ocrLoading ? 'OCR Loading' : 'OCR Document'}
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
	const [inputValue, setInputValue] = useState(String(currentPage))
	const timeout = useRef<NodeJS.Timeout>(null)

	const onPrev = () => {
		const prevPage = Math.max(currentPage - 1, 1)
		onPageChange(prevPage)
		setInputValue(String(prevPage))
	}

	const onNext = () => {
		if (!totalPages) return
		const nextPaga = Math.min(currentPage + 1, totalPages)
		onPageChange(nextPaga)
		setInputValue(String(nextPaga))
	}

	const onPageInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (timeout.current) clearTimeout(timeout.current)
		setInputValue(e.target.value)

		timeout.current = setTimeout(() => {
			if (e.target.value) onPageChange(Number(e.target.value))
		}, DEBOUNCE_TIME)
	}

	return (
		<div className={styles.pageSelect}>
			<button disabled={!totalPages} onClick={onPrev}>
				{'<'}
			</button>
			<input
				aria-label="Page"
				disabled={!totalPages}
				type="number"
				value={inputValue}
				onChange={onPageInputChange}
			/>
			{'/'}
			<output aria-label="Total pages">{totalPages ?? 0}</output>
			<button disabled={!totalPages} onClick={onNext}>
				{'>'}
			</button>
		</div>
	)
}

const DEBOUNCE_TIME = 500
