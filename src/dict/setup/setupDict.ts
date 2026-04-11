import {join, dirname} from 'path'
import {fileURLToPath} from 'url'
import {loadDictionary} from '@scriptin/jmdict-simplified-loader'
import {DictDb} from '../db/db.dict.js'
import {insertMecabPos, insertTags} from '../db/setupInserts.dict.js'
import {Worker} from 'worker_threads'
import {cpus} from 'os'
import {Msg} from './setupTypes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const WORKER_COUNT = cpus().length - 1 || 1
const MAX_QUEUE_PER_WORKER = 100

class WorkerPool {
	private workers: Worker[] = []
	private queues: number[] = []

	constructor(workerScript: string, count: number) {
		for (let i = 0; i < count; i++) {
			const worker = new Worker(workerScript)
			this.workers.push(worker)
			this.queues.push(0)

			worker.on('message', ({success}: {success: boolean}) => {
				if (success) {
					this.queues[i]--
				} else {
					throw new Error('Worker Error')
				}
			})
		}
	}

	async send(data: Msg): Promise<void> {
		const workerIdx = this.queues.indexOf(Math.min(...this.queues))
		const worker = this.workers[workerIdx]

		while (this.queues[workerIdx] >= MAX_QUEUE_PER_WORKER) {
			await new Promise((resolve) => setTimeout(resolve, 10))
		}

		this.queues[workerIdx]++
		worker.postMessage(data)
	}

	async waitAll(): Promise<void> {
		while (this.queues.some((q) => q > 0)) {
			await new Promise((resolve) => setTimeout(resolve, 50))
		}
	}

	terminate() {
		this.workers.forEach((w) => w.terminate())
	}
}

async function setupDict(file: string) {
	console.log('open db')
	DictDb.open()

	const path = join(__dirname, file)
	const pool = new WorkerPool(join(__dirname, 'dictWorker.js'), WORKER_COUNT)

	let mecabMap: Record<string, number>
	let tagsMap: Record<string, number>

	console.log('Loading metadata...')
	await new Promise<void>((resolve) => {
		loadDictionary('jmdict', path)
			.onMetadata(async (metadata) => {
				console.log('inserting metadata')
				const [tags, mecab] = await Promise.all([
					insertTags(metadata.tags),
					insertMecabPos()
				])
				console.log('metadata ready')
				mecabMap = mecab
				tagsMap = tags
				resolve()
			})
			.onEntry(() => {})
			.onEnd(() => {})
	})

	console.log('Processing entries...')
	loadDictionary('jmdict', path)
		.onMetadata(() => {})
		.onEntry((entry) => {
			console.log(`Adding ${entry.id} record`)
			pool.send({jMdictWord: entry, mecab: mecabMap, tags: tagsMap})
		})
		.onEnd(async () => {
			try {
				await pool.waitAll()
				console.log('Done!')
			} catch (error) {
				console.error(error)
			} finally {
				pool.terminate()
				DictDb.close()
			}
		})
}

setupDict('../../../jmDict/jmdict-eng-3.6.2.json').catch(console.error)
