import { UserModel } from "../../models/user.js";
import { UserRepository } from "../../repositories/user.repositoty.js";
import { positiveInt } from "../../shared/parser.js";
import { unwrap } from "../../utils/result.util.js";
import { pipe } from "effect";
import { z } from "zod";
const handler = async (self)=>{
    self.get("/:id", {
        schema: {
            params: z.object({
                id: positiveInt()
            }),
            tags: [
                "users"
            ],
            response: {
                200: UserModel
            }
        }
    }, async ({ params })=>pipe(self.resolveRepository(UserRepository), (userRepository)=>userRepository.findById(params.id), unwrap));
};
export default handler;

//# sourceMappingURL=me.handler.js.map