import {Link} from '@tanstack/react-router'
import styles from './Header.module.css'
import type {ComponentProps, FC} from 'react'

export const Header: FC = () => {
	return (
		<header className={styles.header}>
			<nav className={styles.nav}>
				<NavLink to={'/generator'}>Generate Text</NavLink>
				<NavLink to={'/analyze'}>Analyze Text</NavLink>
			</nav>
		</header>
	)
}

const NavLink: FC<ComponentProps<typeof Link>> = (props) => {
	return (
		<Link
			{...props}
			className={styles.link}
			activeProps={{
				className: styles.active
			}}
		/>
	)
}
