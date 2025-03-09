import type {
	HttpExceptionResponse,
	IntoResponse
} from "@root/types/result.type.js"
import { Data } from "effect"

export class NoneError
	extends Data.TaggedError("None")
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: 500,
			msg: "none value"
		}
	}
}
