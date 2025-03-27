import { fromUnknownToResponse } from "@utils/error.util"
import { Data } from "effect"
import type { IntoResponse } from "#types/result.type"

export class JwtSignException
	extends Data.TaggedError("JwtSignException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return fromUnknownToResponse(this)
	}
}
