import { fromUnknownToResponse } from "@utils/error.util"
import { Data } from "effect"
import type { IntoResponse } from "#types/result.type"

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
