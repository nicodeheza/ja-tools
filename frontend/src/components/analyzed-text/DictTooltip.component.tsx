import type {FC, ReactNode} from 'react'
import type {Dict, Word} from '../../types/analyzedText.types'
import {Root, Trigger, Portal, Content} from '@radix-ui/react-popover'
import styles from './DictTooltip.module.css'

interface Props {
	dict: Dict
	ids: string[]
	children: ReactNode
}

export const DictTooltip: FC<Props> = ({dict, ids, children}) => {
	return (
		<Root>
			<Trigger asChild>
				<samp className={styles.children}>{children}</samp>
			</Trigger>
			<Portal>
				<Content className={styles.content}>
					<div className={styles.card}>
						{ids.map((id) => (
							<DictEntry word={dict[id]} key={id} />
						))}
					</div>
				</Content>
			</Portal>
		</Root>
	)
}

interface DictEntryProps {
	word: Word
}

const DictEntry: FC<DictEntryProps> = ({word}) => {
	return (
		<div>
			<div className={styles.kanasContainer}>
				<Kanas kanas={word.kanji} className={styles.kanji} />
				<Kanas kanas={word.kana} />
			</div>
			<Sense sense={word.sense} />
		</div>
	)
}

const Kanas = ({kanas, className}: {kanas: string[]; className?: string}) => {
	return (
		<div>
			{kanas.map((k, i) => (
				<span key={i} className={className}>
					- {k}{' '}
				</span>
			))}
		</div>
	)
}

const Sense = ({sense}: {sense: Word['sense']}) => {
	return (
		<div>
			{sense.map((s, i) => (
				<div className={styles.sense} key={i}>
					<Pos pos={s.pos} />
					<Gloss gloss={s.gloss} />
				</div>
			))}
		</div>
	)
}

const Pos = ({pos}: {pos: string[]}) => {
	return (
		<div>
			{pos.map((k, i) => (
				<span className={styles.pos} key={i}>
					{k}
				</span>
			))}
		</div>
	)
}

const Gloss = ({gloss}: {gloss: string[]}) => {
	return (
		<ul className={styles.glossList}>
			{gloss.map((k, i) => (
				<li key={i}>{k}</li>
			))}
		</ul>
	)
}
