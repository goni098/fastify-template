import type {
	HttpExceptionResponse,
	IntoResponse
} from "@root/types/result.type.js"
import { Data } from "effect"

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
