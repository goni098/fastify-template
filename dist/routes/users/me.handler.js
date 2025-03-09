import { UserRepository } from "../../repositories/user.repositoty.js";
import { consumeResult } from "../../utils/consume-result.util.js";
import { pipe } from "effect";
import { z } from "zod";
const handler = async (self)=>{
    self.get("/:id", {
        schema: {
            params: z.object({
                id: z.string().transform(Number).pipe(z.number().int().min(1))
            }),
            tags: [
                "users"
            ]
        }
    }, async ({ params })=>pipe(self.resolveRepository(UserRepository), (userRepository)=>userRepository.findById(params.id), consumeResult));
};
export default handler;

//# sourceMappingURL=me.handler.js.map