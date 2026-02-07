import {createFileRoute} from '@tanstack/react-router'
import {Analyze} from './-analyze/Analyze.view'

export const Route = createFileRoute('/analyze/')({
	component: RouteComponent
})

function RouteComponent() {
	return <Analyze />
}
