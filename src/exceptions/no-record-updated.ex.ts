import { Data } from "effect"
import type { HttpExceptionResponse, IntoResponse } from "#types/result.type"

export class NoRecordUpdatedException
	extends Data.TaggedError("NoRecordUpdatedException")
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: 500,
			message: "No record has updated",
			tag: this._tag
		}
	}
}
