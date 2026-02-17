import {useRef, type FC, type ReactNode, type ChangeEvent} from 'react'
import {Button} from '../Button/Button.component'
import styles from './FileInput.module.css'

interface Props {
	file?: File
	onFileChange: (file: File) => void
	accept: string
	children: ReactNode
	disabled?: boolean
}

export const FileInput: FC<Props> = ({
	file,
	onFileChange,
	accept,
	children,
	disabled = false
}) => {
	const inputRef = useRef<HTMLInputElement>(null)

	const handleButtonClick = () => {
		inputRef.current?.click()
	}

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0]
		if (!selectedFile) return
		onFileChange(selectedFile)
	}

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				onChange={handleFileChange}
				disabled={disabled}
				className={styles.fileInput}
			/>
			<Button onClick={handleButtonClick} disabled={disabled}>
				{file ? file.name : children}
			</Button>
		</>
	)
}
