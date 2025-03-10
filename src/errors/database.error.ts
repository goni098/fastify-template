import type { IntoResponse } from "@root/types/result.type.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { Data, pipe } from "effect"

export class DatabaseError
	extends Data.TaggedError("Database")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return pipe(this.error, toError, retrieveErrorMessage, msg => ({
			msg,
			code: 500
		}))
	}
}
