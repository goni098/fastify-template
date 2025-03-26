import { Effect as E, Either, identity, pipe } from "effect"
import type { Result } from "#types/result.type.js"

export const unwrapResult = <A, E>(result: Result<A, E>) =>
	pipe(result, E.either, E.runPromise).then(
		Either.match({
			onLeft: error => {
				throw error
			},
			onRight: identity
		})
	)
