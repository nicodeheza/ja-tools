import type {
	AsyncDataError,
	AsyncDataIdle,
	AsyncDataLoading,
	AsyncDataSuccess
} from '../types/asyncData.types'

export function getIdleState(): AsyncDataIdle {
	return {
		status: 'idle',
		data: undefined,
		error: undefined
	}
}
export function getLoadingState(): AsyncDataLoading {
	return {
		status: 'loading',
		data: undefined,
		error: undefined
	}
}

export function getErrorState(error: Error): AsyncDataError {
	return {
		status: 'error',
		data: undefined,
		error
	}
}

export function getSuccessState<T>(data: T): AsyncDataSuccess<T> {
	return {
		status: 'success',
		data,
		error: undefined
	}
}
