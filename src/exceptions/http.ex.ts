import { Data, Effect as E } from "effect"
import type { HttpExceptionResponse, IntoResponse } from "#types/result.type"

export class HttpException
	extends Data.TaggedError("HttpException")<{
		code: number
		message: string
	}>
	implements IntoResponse
{
	public intoResponse(): HttpExceptionResponse {
		return {
			code: this.code,
			message: this.message,
			tag: this._tag
		}
	}

	static badRequest(message = "Bad Request") {
		return new HttpException({ code: 400, message })
	}

	static unauthorized(message = "Unauthorized") {
		return new HttpException({ code: 401, message })
	}

	static forbidden(message: "Forbidden") {
		return new HttpException({ code: 403, message })
	}

	static internal(message = "Internal Server Error") {
		return new HttpException({ code: 500, message })
	}

	static BadRequest(message = "Bad Request") {
		return E.fail(HttpException.unauthorized(message))
	}

	static Unauthorized(message = "Unauthorized") {
		return E.fail(HttpException.unauthorized(message))
	}

	static Internal(message = "Internal Server Error") {
		return E.fail(HttpException.internal(message))
	}
}
