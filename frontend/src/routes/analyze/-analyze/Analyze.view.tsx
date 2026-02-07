import type {FC} from 'react'
import {useAnalyzedText} from './analyze.service'
import {InputPage} from './components/InputPage.component'
import {ResultPage} from './components/ResultPage.component'
import styles from './Analyze.module.css'

export const Analyze: FC = () => {
	const {status, data, error, analyzeText, removeData} = useAnalyzedText()

	if (status === 'loading') {
		return <p>Loading...</p>
	}

	if (status === 'error' && error) {
		return <p className={styles.error}>{error.message}</p>
	}

	if (status === 'success' && data) {
		return <ResultPage data={data} onClear={removeData} />
	}

	// inactive state
	return <InputPage onSubmit={analyzeText} />
}
