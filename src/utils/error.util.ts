import { Boolean as B, pipe } from "effect"
import { constVoid } from "effect/Function"
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { DateTime } from "luxon"
import type { HttpExceptionResponse, IntoResponse } from "#types/result.type.js"

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

const traceException = (
	request: FastifyRequest,
	response: HttpExceptionResponse,
	exception: IntoResponse
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
					exception
				})
		}),
		() => response
	)

export const handleException = (
	exception: IntoResponse,
	request: FastifyRequest,
	reply: FastifyReply
) =>
	pipe(
		exception.intoResponse(),
		response => traceException(request, response, exception),
		response => reply.status(response.code).send(response)
	)
