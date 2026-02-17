import type {FC, Ref} from 'react'

interface Props {
	ref: Ref<HTMLCanvasElement>
}

export const PdfPage: FC<Props> = ({ref}) => {
	return (
		<div>
			<canvas ref={ref} />
		</div>
	)
}
