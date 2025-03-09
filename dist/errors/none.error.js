import { Data } from "effect";
export class NoneError extends Data.TaggedError("None") {
    intoResponse() {
        return {
            code: 500,
            msg: "none value"
        };
    }
}

//# sourceMappingURL=none.error.js.map