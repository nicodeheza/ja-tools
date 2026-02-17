import {createFileRoute} from '@tanstack/react-router'
import {PdfOcr} from './-pdf-ocr/PdfOcr.page'

export const Route = createFileRoute('/pdf-ocr/')({
	component: RouteComponent
})

function RouteComponent() {
	return <PdfOcr />
}
