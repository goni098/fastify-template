import { userSelectSchema } from "@root/database/models/user.model.js"
import { UserRepository } from "@root/database/repositories/user.repositoty.js"
import { positiveInt } from "@root/shared/parser.js"
import { unwrap } from "@root/utils/result.util.js"
import { pipe } from "effect"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

const handler: FastifyPluginAsyncZod = async self => {
	self.get(
		"/:id",
		{
			schema: {
				params: z.object({
					id: positiveInt()
				}),
				tags: ["users"],
				response: {
					200: userSelectSchema.merge(
						z.object({
							id: z.bigint().transform(String)
						})
					)
				}
			}
		},
		async ({ params }) =>
			pipe(
				self.resolveRepository(UserRepository),
				userRepository => userRepository.findById(params.id),
				unwrap
			)
	)
}

export default handler
