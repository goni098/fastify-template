import type { IntoResponse } from "@root/types/result.type.js"
import { Effect, Either, identity, pipe } from "effect"

export const consumeResult = <A, E extends IntoResponse>(
	effect: Effect.Effect<A, E>
) =>
	pipe(effect, Effect.either, Effect.runPromise).then(
		Either.match({
			onLeft: error => {
				throw error
			},
			onRight: identity
		})
	)
