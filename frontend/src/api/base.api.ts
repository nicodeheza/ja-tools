interface ErrorsMap {
	default: string
	[status: number]: string
}

export async function post<T>(
	url: string,
	body: object,
	errorMap: ErrorsMap
): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	})

	return getData(res, errorMap)
}

async function getData<T>(res: Response, errorMap: ErrorsMap): Promise<T> {
	const data = await res.json()

	if (!res.ok) {
		console.error({
			status: res.status,
			data: data
		})

		const error = errorMap[res.status] ?? errorMap.default
		throw new Error(error)
	}

	return data
}
