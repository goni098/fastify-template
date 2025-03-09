import { UserRepository } from "@root/repositories/user.repositoty.js"
import { consumeResult } from "@root/utils/consume-result.util.js"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.get(
		"/:id",
		{
			schema: {
				params: z.object({
					id: z.string().transform(Number).pipe(z.number().int().min(1))
				}),
				tags: ["users"]
			}
		},
		async ({ params }) =>
			pipe(
				self.resolveRepository(UserRepository),
				userRepository => userRepository.findById(params.id),
				consumeResult
			)
	)
}

export default handler
