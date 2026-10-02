import { useRef, type FC, type ReactNode } from 'react'
import { useGetIsAiSetUp } from '../../services/user.service'
import { AiKeyModal, type AiKeyModalHandle } from '../AiKeyModal/AiKeyModal.component'
import { Button } from '../Button/Button.component'
import styles from './AiPage.module.css'
import { ToolDescription } from '../ToolDescription/ToolDescription.component'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage.component'
import { LoadingDots } from '../LoadingDots/LoadingDots.component'
import { Card } from '../Card/Card.component'

interface Props {
  toolTitle: string
  toolDescription: string
  children: ReactNode
}

export const AiPage: FC<Props> = ({ toolDescription, toolTitle, children }) => {
  const modalRef = useRef<AiKeyModalHandle>(null)
  const isAiSetUpRes = useGetIsAiSetUp()

  if (isAiSetUpRes.status === 'loading') {
    return <LoadingDots />
  }

  if (isAiSetUpRes.status == 'error') {
    return <ErrorMessage message="Something went wrong. Please try again later." />
  }

  if (isAiSetUpRes.data === true) {
    return <>{children}</>
  }

  return (
    <div className={styles.container}>
      <ToolDescription title={toolTitle} descriptions={toolDescription} />

      <Card className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>Set up your free Google Gemini API key</h3>

        <ol className={styles.steps}>
          <li>
            Go to{' '}
            <a
              href="https://aistudio.google.com/app/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              aistudio.google.com/app/api-keys
            </a>
          </li>
          <li>Sign in with your Google account and create a new API key</li>
          <li>Copy it and paste it using the button below</li>
        </ol>

        <div className={styles.notes}>
          <p>
            <strong>Privacy:</strong> Your key is saved in a secure encrypted cookie. Only our
            server can read it — we never store or log it anywhere.
          </p>
          <p>
            <strong>Cost:</strong> We only use Google AI models that offer a free tier, so you won't
            be charged. Google applies usage limits to free keys, but for normal use you won't hit
            them.
          </p>
        </div>

        <Button onClick={() => modalRef.current?.open()}>Set up API Key</Button>
      </Card>

      <AiKeyModal ref={modalRef} />
    </div>
  )
}
