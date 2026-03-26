const DB_NAME = 'pdf-storage'
const STORE_NAME = 'files'
const FILE_KEY = 'current'
const DB_VERSION = 1

const dbPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
	const request = indexedDB.open(DB_NAME, DB_VERSION)

	request.onupgradeneeded = () => {
		request.result.createObjectStore(STORE_NAME)
	}

	request.onsuccess = () => resolve(request.result)
	request.onerror = () => reject(request.error)
})

export async function saveFile(file: File): Promise<void> {
	const db = await dbPromise
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).put(file, FILE_KEY)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

export async function loadFile(): Promise<File | undefined> {
	const db = await dbPromise
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly')
		const request = tx.objectStore(STORE_NAME).get(FILE_KEY)
		request.onsuccess = () => resolve(request.result as File | undefined)
		request.onerror = () => reject(request.error)
	})
}

export async function clearFile(): Promise<void> {
	const db = await dbPromise
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).delete(FILE_KEY)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}
