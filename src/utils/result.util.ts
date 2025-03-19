import type { Result } from "@root/types/result.type.js"
import { Effect, Either, identity, pipe } from "effect"

export const unwrap = <A, E>(result: Result<E, A>) =>
	pipe(result, Effect.either, Effect.runPromise).then(
		Either.match({
			onLeft: error => {
				throw error
			},
			onRight: identity
		})
	)
