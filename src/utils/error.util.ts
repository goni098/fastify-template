import { Boolean as B, pipe } from "effect"
import { constVoid } from "effect/Function"
import type { FastifyError, FastifyRequest } from "fastify"
import { DateTime } from "luxon"
import type { HttpExceptionResponse, IntoResponse } from "#types/result.type"

export const intoError = (error: unknown) =>
	error instanceof Error ? error : new Error(JSON.stringify(error, null, 2))

export const retrieveErrorMessage = ({ message }: Error) => message

export const canIntoResponse = (error: unknown): error is IntoResponse =>
	Object.hasOwn(error as object, "_tag")

export const isFastifyError = (error: unknown): error is FastifyError =>
	Object.hasOwn(error as object, "statusCode")

export const fromUnknownToResponse = <
	E extends { _tag: string; error: unknown }
>(
	ex: E,
	code = 500
): HttpExceptionResponse =>
	pipe(ex.error, intoError, retrieveErrorMessage, message => ({
		message,
		code,
		tag: ex._tag
	}))

export const traceError = (
	request: FastifyRequest,
	response: HttpExceptionResponse,
	originalError: unknown
) =>
	pipe(
		response.code === 500,
		B.match({
			onFalse: constVoid,
			onTrue: () =>
				console.error({
					timestamp: DateTime.now().toISO(),
					endpoint: request.url,
					method: request.method,
					originalError
				})
		}),
		() => response
	)
