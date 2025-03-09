import { Data } from "effect";
export class NoneError extends Data.TaggedError("None") {
    intoException() {
        return {
            code: 500,
            msg: "none value"
        };
    }
}

//# sourceMappingURL=none.error.js.map