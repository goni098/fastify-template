import { Effect, Either, identity, pipe } from "effect";
export const consumeResult = (effect)=>pipe(effect, Effect.either, Effect.runPromise).then(Either.match({
        onLeft: (error)=>{
            throw error;
        },
        onRight: identity
    }));

//# sourceMappingURL=consume-result.util.js.map