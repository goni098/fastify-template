import type { Effect } from "effect/Effect"

export type Result<A, E> = Effect<A, E, never>

export interface IntoResponse {
	intoResponse(): HttpExceptionResponse
}

export interface HttpExceptionResponse {
	code: number
	message: string
	tag: string
}
