import Ocr, {type Line} from '@gutenye/ocr-browser'
import * as ort from 'onnxruntime-web'
import type {OcrResult} from '../pdfOcr.types'

// Disable multi-threading to avoid SharedArrayBuffer / COOP+COEP requirements.
// ORT resolves WASM files relative to the JS chunk via import.meta.url,
// which works correctly when onnxruntime-web is excluded from Vite pre-bundling.
ort.env.wasm.numThreads = 1

let OCR: Ocr

export async function ocrInit(): Promise<void> {
	OCR = await Ocr.create({
		models: {
			detectionPath: '/assets/ch_PP-OCRv4_det_infer.onnx',
			recognitionPath: '/assets/japan_PP-OCRv3_rec_infer.onnx',
			dictionaryPath: '/assets/japan_dict.txt'
		}
	})
}

export async function detect(dataUrl: string): Promise<OcrResult[]> {
	if (!OCR) throw new Error('OCR not initialized')
	const res = await OCR.detect(dataUrl)
	return res.map(lineToOcrResult)
}

function lineToOcrResult(line: Line): OcrResult {
	const points = line.box ?? []

	if (points.length === 0) {
		return {
			text: line.text,
			box: {x: 0, y: 0, w: 0, h: 0}
		}
	}

	const xs = points.map((point) => point[0])
	const ys = points.map((point) => point[1])
	const minX = Math.min(...xs)
	const minY = Math.min(...ys)
	const maxX = Math.max(...xs)
	const maxY = Math.max(...ys)

	return {
		text: line.text,
		box: {
			x: minX,
			y: minY,
			w: maxX - minX,
			h: maxY - minY
		}
	}
}
