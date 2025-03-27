import { fromUnknownToResponse } from "@utils/error.util"
import { Data } from "effect"
import type { IntoResponse } from "#types/result.type"

export class RedisException
	extends Data.TaggedError("RedisException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return fromUnknownToResponse(this)
	}
}
