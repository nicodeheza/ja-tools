import type {FC} from 'react'
import {FuriganaSettings} from '../../../../components/settings/FuriganaSettings.component'
import {AnalyzedText} from '../../../../components/analyzed-text/AnalyzedText.component'
import {Button} from '../../../../components/Button/Button.component'
import type {AnalyzeData} from '../analyze.types'
import styles from './ResultPage.module.css'

interface Props {
	data: AnalyzeData
	onClear: () => void
}

export const ResultPage: FC<Props> = ({data, onClear}) => {
	return (
		<div className={styles.container}>
			<div className={styles.furiganaSettingsContainer}>
				<FuriganaSettings />
			</div>
			<div>
				<p className={styles.text}>
					<AnalyzedText tokens={data.tokens} dict={data.dict} />
				</p>
			</div>
			<Button variant="primary" onClick={onClear}>
				Clear
			</Button>
		</div>
	)
}
