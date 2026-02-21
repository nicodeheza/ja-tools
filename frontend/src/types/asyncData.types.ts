export interface AsyncDataIdle {
	status: 'idle'
	data: undefined
	error: undefined
}
export interface AsyncDataLoading {
	status: 'loading'
	data: undefined
	error: undefined
}
export interface AsyncDataError {
	status: 'error'
	data: undefined
	error: Error
}
export interface AsyncDataSuccess<T> {
	status: 'success'
	data: T
	error: undefined
}

export type IdleAsyncData<T> =
	| AsyncDataIdle
	| AsyncDataLoading
	| AsyncDataError
	| AsyncDataSuccess<T>

export type AsyncData<T> = AsyncDataLoading | AsyncDataError | AsyncDataSuccess<T>
