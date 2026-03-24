type Node<T> = {
	key: string
	value: T
	prev: Node<T> | null
	next: Node<T> | null
}

export class Cache<T> {
	private maxSize: number
	private map: {[key: string]: Node<T>}
	private head: Node<T> | null
	private tail: Node<T> | null
	private size: number

	constructor(maxSize: number) {
		this.maxSize = maxSize
		this.map = {}
		this.head = null
		this.tail = null
		this.size = 0
	}

	get(key: string): T | undefined {
		const node = this.map[key]
		if (node === undefined) return undefined
		this.moveToHead(node)
		return node.value
	}

	add(key: string, value: T): void {
		const existing = this.map[key]
		if (existing !== undefined) {
			existing.value = value
			this.moveToHead(existing)
			return
		}

		const node: Node<T> = {key, value, prev: null, next: null}
		this.map[key] = node
		this.addToHead(node)
		this.size++

		if (this.size > this.maxSize) {
			this.removeTail()
		}
	}

	remove(key: string): void {
		const node = this.map[key]
		if (node === undefined) return
		this.unlinkNode(node)
		delete this.map[key]
		this.size--
	}

	clear(): void {
		this.map = {}
		this.head = null
		this.tail = null
		this.size = 0
	}

	private addToHead(node: Node<T>): void {
		node.prev = null
		node.next = this.head

		if (this.head !== null) {
			this.head.prev = node
		}

		this.head = node

		if (this.tail === null) {
			this.tail = node
		}
	}

	private unlinkNode(node: Node<T>): void {
		if (node.prev !== null) {
			node.prev.next = node.next
		} else {
			this.head = node.next
		}

		if (node.next !== null) {
			node.next.prev = node.prev
		} else {
			this.tail = node.prev
		}

		node.prev = null
		node.next = null
	}

  private moveToHead(node: Node<T>): void {
    if (this.head !== null && this.head.key === node.key) return
		this.unlinkNode(node)
		this.addToHead(node)
	}

	private removeTail(): void {
		if (this.tail === null) return
		const lru = this.tail
		this.unlinkNode(lru)
		delete this.map[lru.key]
		this.size--
	}
}
