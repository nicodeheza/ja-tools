import type {FC} from 'react'
import {FuriganaSettings} from '../../../../components/settings/FuriganaSettings.component'
import {AnalyzedText} from '../../../../components/analyzed-text/AnalyzedText.component'
import {Button} from '../../../../components/Button/Button.component'
import type {AnalyzeData} from '../analyze.types'

interface Props {
	data: AnalyzeData
	onClear: () => void
}

export const ResultPage: FC<Props> = ({data, onClear}) => {
	return (
		<div>
			<FuriganaSettings />
			<div>
				<p>
					<AnalyzedText tokens={data.tokens} dict={data.dict} />
				</p>
			</div>
			<Button variant="secondary" onClick={onClear}>
				Clear
			</Button>
		</div>
	)
}
