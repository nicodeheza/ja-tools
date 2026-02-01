export class JsonStorage<T> {
	private key: string
	constructor(key: string) {
		this.key = key
	}

	public getData(): T | undefined {
		const storage = localStorage.getItem(this.key)
		if (!storage) return
		return JSON.parse(storage)
	}
	public saveData(data: T) {
		localStorage.setItem(this.key, JSON.stringify(data))
	}
}
