import {useEffect, type FC, type FormEvent} from 'react'
import {useGenerateText} from './TextGenerator.service'
import styles from './TextGenerator.module.css'
import {FuriganaSettings} from '../../../components/settings/FuriganaSettings.component'
import {AnalyzedText} from '../../../components/analyzed-text/AnalyzedText.component'
import {Button} from '../../../components/Button/Button.component'
import {Translation} from './components/translation/Translation.component'

export const TextGenerator: FC = () => {
	const {
		generateText,
		paragraphs,
		error,
		connectionState,
		dict,
		setFromCache,
		userPrompt,
		setUserPrompt
	} = useGenerateText()

	useEffect(() => {
		setFromCache()
	}, [setFromCache])

	if (error) {
		return <p>{error}</p>
	}

	const isConnected = connectionState === 'connected'
	const isLoading = connectionState === 'loading'
	const isDisconnected = connectionState === 'disconnected'
	const canSendReq = isDisconnected && !isLoading

	const onSendPrompt = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		generateText()
	}

	return (
		<div>
			<FuriganaSettings />
			<div className={styles.result}>
				{paragraphs.map((p, i) => (
					<div className={styles.paragraph} key={i}>
						<p className={styles.text}>
							<AnalyzedText tokens={p.tokens} dict={dict} />
						</p>
						<Translation translation={p.translation} />
					</div>
				))}
			</div>
			{isLoading && (
				<div>
					<p>Connecting...</p>
				</div>
			)}
			{isConnected && (
				<div>
					<p>Generating text...</p>
				</div>
			)}
			<form className={styles.prompt} onSubmit={onSendPrompt}>
				<textarea
					value={userPrompt}
					onChange={(e) => setUserPrompt(e.target.value)}
					disabled={!canSendReq}
					placeholder="Ex: Create a story abut a cat."
					required
				/>
				<Button variant="primary" type="submit" disabled={!canSendReq}>
					Generate new text
				</Button>
			</form>
		</div>
	)
}
