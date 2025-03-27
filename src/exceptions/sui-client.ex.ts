import { fromUnknownToResponse } from "@utils/error.util"
import { Data } from "effect"
import type { IntoResponse } from "#types/result.type"

export class SuiClientException
	extends Data.TaggedError("SuiClientException")<{
		error: unknown
	}>
	implements IntoResponse
{
	public intoResponse() {
		return fromUnknownToResponse(this)
	}
}
