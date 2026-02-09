import {createRootRoute, Outlet} from '@tanstack/react-router'
import {TanStackRouterDevtools} from '@tanstack/react-router-devtools'
import {Header} from '../components/Header/Header.component'

const RootLayout = () => (
	<>
		<Header />
		<Outlet />
		<TanStackRouterDevtools />
	</>
)

export const Route = createRootRoute({component: RootLayout})
