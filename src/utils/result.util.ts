import type { Result } from "@root/types/result.type.js"
import { Effect as E, Either, identity, pipe } from "effect"

export const unwrapResult = <A, E>(result: Result<E, A>) =>
	pipe(result, E.either, E.runPromise).then(
		Either.match({
			onLeft: error => {
				throw error
			},
			onRight: identity
		})
	)
