import type {
	HttpExceptionResponse,
	IntoResponse
} from "@root/types/result.type.js"
import { Data, Effect as E } from "effect"

export class HttpError
	extends Data.TaggedError("Http")<{
		code: number
		message: string
	}>
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: this.code,
			message: this.message
		}
	}

	static BadRequest(message = "Bad Request") {
		return new HttpError({ code: 400, message })
	}

	static Unauthorized(message = "Unauthorized") {
		return new HttpError({ code: 401, message })
	}

	static Forbidden(message: "Forbidden") {
		return new HttpError({ code: 403, message })
	}

	static Internal(message = "Internal Server Error") {
		return new HttpError({ code: 500, message })
	}

	static FromBadRequest(message = "Bad Request") {
		return E.fail(HttpError.Unauthorized(message))
	}

	static FromUnauthorized(message = "Unauthorized") {
		return E.fail(HttpError.Unauthorized(message))
	}

	static FromInternal(message = "Internal Server Error") {
		return E.fail(HttpError.Internal(message))
	}
}
