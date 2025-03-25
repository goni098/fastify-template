import type { IntoResponse } from "@root/types/result.type.js"
import { fromUnknownToResponse } from "@root/utils/error.util.js"
import { Data } from "effect"

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
