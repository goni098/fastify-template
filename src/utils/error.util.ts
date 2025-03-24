import type { IntoResponse } from "@root/types/result.type.js"
import type { FastifyError } from "fastify"

export const toError = (error: unknown) =>
	error instanceof Error ? error : new Error(JSON.stringify(error, null, 2))

export const retrieveErrorMessage = ({ message }: Error) => message

export const canIntoResponse = (error: unknown): error is IntoResponse =>
	Object.hasOwn(error as object, "_tag")

export const isFastifyError = (error: unknown): error is FastifyError =>
	Object.hasOwn(error as object, "statusCode")
