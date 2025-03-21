import type {
	HttpExceptionResponse,
	IntoResponse
} from "@root/types/result.type.js"
import { Data } from "effect"

export class VerifySigException
	extends Data.TaggedError("VerifySigException")<{ message: string }>
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: 401,
			message: this.message
		}
	}
}
