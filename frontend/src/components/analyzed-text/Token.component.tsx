import type { FC } from 'react'
import type { Dict, NoWordToken, TokenRes, WordToken } from '../../types/analyzedText.types'
import { Furigana } from './Furigana.component'
import { DictTooltip } from './DictTooltip.component'

interface Props {
  token: TokenRes
  dict: Dict
}

export const TokenComponent: FC<Props> = ({ token, dict }) => {
  if (!token.isWord) return <NoWordTokenComponent token={token} />
  if (!token.dictIds.length) return token.original
  return (
    <DictTooltip dict={dict} ids={token.dictIds}>
      <WordTokenComponent token={token} />
    </DictTooltip>
  )
}

interface NoWordTokenComponentProps {
  token: NoWordToken
}
const NoWordTokenComponent: FC<NoWordTokenComponentProps> = ({ token }) => {
  if (token.original === '\n') return <br />
  if (token.original === 'BOS' || token.original === 'EOS') return ''
  return token.original
}

interface WordTokenComponentProps {
  token: WordToken
}

const WordTokenComponent: FC<WordTokenComponentProps> = ({ token }) => {
  if (token.furigana) return <Furigana furigana={token.furigana} />
  return token.original
}
