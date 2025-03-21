import type { IntoResponse } from "@root/types/result.type.js"
import { retrieveErrorMessage, toError } from "@root/utils/error.util.js"
import { Data, pipe } from "effect"

export class SuiClientException
	extends Data.TaggedError("SuiClientException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return pipe(this.error, toError, retrieveErrorMessage, message => ({
			message,
			code: 500
		}))
	}
}
