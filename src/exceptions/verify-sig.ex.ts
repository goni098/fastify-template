import { Data } from "effect"
import type { HttpExceptionResponse, IntoResponse } from "#types/result.type.js"

export class VerifySigException
	extends Data.TaggedError("VerifySigException")<{ message: string }>
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: 401,
			message: this.message,
			tag: this._tag
		}
	}
}
