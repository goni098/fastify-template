import { Effect, Either, identity, pipe } from "effect"

export const unwrap = <A, E>(effect: Effect.Effect<A, E>) =>
	pipe(effect, Effect.either, Effect.runPromise).then(
		Either.match({
			onLeft: error => {
				throw error
			},
			onRight: identity
		})
	)
