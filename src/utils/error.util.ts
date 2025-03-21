import type { IntoResponse } from "@root/types/result.type.js"

export const toError = (error: unknown) =>
	error instanceof Error ? error : new Error(JSON.stringify(error, null, 2))

export const retrieveErrorMessage = ({ message }: Error) => message

export const canIntoResponse = (error: unknown): error is IntoResponse =>
	Boolean((error as Record<string, unknown>)?._tag)
