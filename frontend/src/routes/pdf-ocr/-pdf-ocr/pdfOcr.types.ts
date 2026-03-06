export interface OcrResult {
	text: string
	box: {
		x: number
		y: number
		w: number
		h: number
	}
}
