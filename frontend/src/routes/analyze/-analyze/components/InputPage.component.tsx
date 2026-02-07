import {useState, type FC, type FormEvent} from 'react'
import {Button} from '../../../../components/Button/Button.component'
import styles from './InputPage.module.css'

interface Props {
	onSubmit: (text: string) => void
}

export const InputPage: FC<Props> = ({onSubmit}) => {
	const [text, setText] = useState('')

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		onSubmit(text)
	}

	return (
		<form onSubmit={handleSubmit} className={styles.form}>
			<textarea
				name="text"
				id="text"
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Insert your Japanese text"
				required
			/>
			<Button type="submit">Analice</Button>
		</form>
	)
}
