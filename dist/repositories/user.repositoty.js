function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
import { DatabaseError } from "../errors/database.error.js";
import { NoneError } from "../errors/none.error.js";
import { Effect as E, pipe } from "effect";
export class UserRepository {
    findById(id) {
        return pipe(E.tryPromise({
            try: ()=>this.prisma.user.findUnique({
                    where: {
                        id
                    }
                }),
            catch: (error)=>new DatabaseError({
                    error
                })
        }), E.flatMap(E.fromNullable), E.catchTag("NoSuchElementException", ()=>E.fail(new NoneError())));
    }
    constructor(prisma){
        _define_property(this, "prisma", void 0);
        this.prisma = prisma;
    }
}

//# sourceMappingURL=user.repositoty.js.map