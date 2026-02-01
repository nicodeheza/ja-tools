import type {FC} from 'react'
import {Button} from '../../../../components/Button/Button.component'

export const InputPage: FC = () => {
	return (
		<form>
			<textarea name="text" id="text" />
			<Button>Analice</Button>
		</form>
	)
}
