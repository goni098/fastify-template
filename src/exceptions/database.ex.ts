import type { IntoResponse } from "@root/types/result.type.js"
import { fromUnknownToResponse } from "@root/utils/error.util.js"
import { Data } from "effect"

export class DatabaseException
	extends Data.TaggedError("DatabaseException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return fromUnknownToResponse(this)
	}
}
