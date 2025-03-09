import { retrieveErrorMessage, toError } from "../utils/error.util.js";
import { Data, pipe } from "effect";
export class DatabaseError extends Data.TaggedError("Database") {
    intoException() {
        return pipe(this.error, toError, retrieveErrorMessage, (msg)=>({
                msg,
                code: 500
            }));
    }
}

//# sourceMappingURL=database.error.js.map