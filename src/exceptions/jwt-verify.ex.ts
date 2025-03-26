import { fromUnknownToResponse } from "@utils/error.util.js"
import { Data } from "effect"
import type { IntoResponse } from "#types/result.type.js"

export class JwtVerifyException
	extends Data.TaggedError("JwtVerifyException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return fromUnknownToResponse(this, 401)
	}
}
